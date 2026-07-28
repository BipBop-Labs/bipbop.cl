import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_FIELDS } from '#/lib/application'
import { resetState } from './applications'
import { closeDb, getDb } from './db'
import { fakeDiscord } from './discord-fake'
import {
  completeInput,
  greet,
  listPendingSessions,
  resetSessions,
  runAttach,
  runShell,
} from './shell'
import { FLAG_VALUE } from './shell-files'

/** PDF mínimo válido. */
const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n')
const IP = '203.0.113.10'

function text(reply: { lines: Array<{ text: string }> }) {
  return reply.lines.map((l) => l.text).join('\n')
}

/**
 * Discord con sus límites de verdad. Si un cambio produce un mensaje que
 * Discord rechazaría, estos tests se caen en vez de pasar en verde.
 */
function discordOk() {
  return fakeDiscord().mock
}

beforeEach(async () => {
  closeDb()
  process.env.DATA_DIR = await mkdtemp(join(tmpdir(), 'bipbop-db-'))
  process.env.DISCORD_WEBHOOK_URL = 'https://discord.test/webhook'
  resetSessions()
  resetState()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('comandos', () => {
  it('abre en blanco, sin instrucciones', () => {
    const reply = greet()
    expect(reply.lines).toEqual([])
    expect(reply.mode).toBe('shell')
    expect(reply.prompt).toBe('$')
  })

  it('lista y lee archivos', async () => {
    const { sessionId } = greet()
    expect(text(await runShell(sessionId, 'ls', IP))).toContain('README.md')
    expect(text(await runShell(sessionId, 'cat README.md', IP))).toContain(
      './postular',
    )
  })

  it('esconde la flag salvo que la busques con ls -a', async () => {
    const { sessionId } = greet()
    expect(text(await runShell(sessionId, 'ls', IP))).not.toContain('.flag')

    const oculto = await runShell(sessionId, 'ls -a', IP)
    expect(text(oculto)).toContain('.flag')
    expect(text(await runShell(sessionId, 'cat .flag', IP))).toContain(
      FLAG_VALUE,
    )
  })

  it('avisa cuando el comando no existe', async () => {
    const { sessionId } = greet()
    const reply = await runShell(sessionId, 'sudo rm -rf /', IP)
    expect(reply.lines.some((l) => l.kind === 'err')).toBe(true)
  })

  it('completa con Tab', () => {
    const { sessionId } = greet()
    expect(completeInput(sessionId, 'he').completion).toBe('help ')
    expect(completeInput(sessionId, 'cat READ').completion).toBe(
      'cat README.md ',
    )
    // Los ocultos solo se completan si ya escribiste el punto.
    expect(completeInput(sessionId, 'cat ').completion).not.toContain('.flag')
    expect(completeInput(sessionId, 'cat .fl').completion).toBe('cat .flag ')
  })
})

/** Recorre los ocho pasos y deja la sesión lista para enviar. */
async function fill(sessionId: string) {
    await runShell(sessionId, 'Ada Lovelace', IP)
    await runShell(sessionId, 'ada@example.com', IP)
    await runShell(sessionId, 'ada', IP)
    await runShell(sessionId, 'ada', IP)
    runAttach(sessionId, {
      bytes: PDF,
      name: 'cv.pdf',
      type: 'application/pdf',
    })
    await runShell(sessionId, 'https://ada.dev/engine construí el motor.', IP)
    await runShell(sessionId, 'Descarté los engranajes extra.', IP)
  return runShell(sessionId, 'Uso IA y verifico todo.', IP)
}

describe('postulación', () => {
  it('pide los datos, adjunta el CV y envía', async () => {
    const fetchMock = discordOk()
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)

    const resumen = await fill(sessionId)
    expect(resumen.mode).toBe('confirm')
    expect(text(resumen)).toContain('ada@example.com')

    // Enter vacío envía, pasado el tiempo mínimo de llenado.
    vi.setSystemTime(Date.now() + 5 * 60_000)
    const enviado = await runShell(sessionId, '', IP)

    expect(enviado.mode).toBe('done')
    expect(text(enviado)).toContain('Postulación recibida')

    const payload = String(
      (fetchMock.mock.calls[0][1]!.body as FormData).get('payload_json'),
    )
    expect(payload).toContain('Ada Lovelace')
    expect(payload).toContain('https://github.com/ada')
    expect(payload).toContain('por la terminal')
    expect(payload).not.toContain('encontró la flag')
  })

  it('marca la postulación cuando trae la flag', async () => {
    const fetchMock = discordOk()
    const { sessionId } = greet()
    await runShell(sessionId, `./postular --flag ${FLAG_VALUE}`, IP)
    await fill(sessionId)

    vi.setSystemTime(Date.now() + 5 * 60_000)
    await runShell(sessionId, '', IP)

    const payload = String(
      (fetchMock.mock.calls[0][1]!.body as FormData).get('payload_json'),
    )
    expect(payload).toContain('encontró la flag')
  })

  it('rechaza una flag inventada', async () => {
    const { sessionId } = greet()
    const reply = await runShell(sessionId, './postular --flag bipbop{nope}', IP)
    expect(reply.mode).toBe('shell')
    expect(text(reply)).toContain('no es')
  })

  it('vuelve a preguntar cuando el dato no sirve', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)

    const malo = await runShell(sessionId, 'no-es-un-correo', IP)
    expect(malo.lines.some((l) => l.kind === 'err')).toBe(true)

    // Sigue en el mismo paso hasta que el dato sea válido.
    const bueno = await runShell(sessionId, 'ada@example.com', IP)
    expect(text(bueno)).toContain('GitHub')
  })

  it('acepta el PDF aunque lo suelten antes de que le toque', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)

    // Lo arrastran apenas empiezan, en el paso 1.
    const temprano = runAttach(sessionId, {
      bytes: PDF,
      name: 'cv.pdf',
      type: 'application/pdf',
    })
    expect(text(temprano)).toContain('adjuntado')
    expect(temprano.mode).toBe('field') // sigue donde iba

    await runShell(sessionId, 'Ada Lovelace', IP)
    await runShell(sessionId, 'ada@example.com', IP)
    await runShell(sessionId, 'ada', IP)

    // Al llegar al paso del CV se lo salta: ya lo tenemos.
    const siguiente = await runShell(sessionId, 'ada', IP)
    expect(text(siguiente)).not.toContain('Tu CV en PDF')
    expect(text(siguiente)).toContain('Algo que hayas construido')
  })

  it('saca el enlace del propio relato del proyecto', async () => {
    const fetchMock = discordOk()
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await fill(sessionId)

    vi.setSystemTime(Date.now() + 5 * 60_000)
    await runShell(sessionId, '', IP)

    const payload = String(
      (fetchMock.mock.calls[0][1]!.body as FormData).get('payload_json'),
    )
    expect(payload).toContain('https://ada.dev/engine')
  })

  it('exige el enlace dentro de la respuesta del proyecto', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)
    await runShell(sessionId, 'ada@example.com', IP)
    await runShell(sessionId, 'ada', IP)
    await runShell(sessionId, 'ada', IP)
    runAttach(sessionId, { bytes: PDF, name: 'cv.pdf', type: 'application/pdf' })

    const sinLink = await runShell(sessionId, 'Construí un motor, sin enlace.', IP)
    expect(text(sinLink)).toContain('Falta el enlace')
  })

  it('retoma la postulación al recargar la página', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)

    // El navegador se recarga y saluda con la misma sesión guardada.
    const devuelta = greet(sessionId)
    expect(text(devuelta)).toContain('Retomando')
    expect(text(devuelta)).toContain('correo')
    expect(devuelta.mode).toBe('field')
  })

  it('sobrevive a un reinicio del servidor', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)
    runAttach(sessionId, { bytes: PDF, name: 'cv.pdf', type: 'application/pdf' })

    closeDb() // como si redesplegáramos: se cae todo lo que había en memoria

    // La sesión sigue donde iba, con el CV puesto.
    const sigue = await runShell(sessionId, 'ada@example.com', IP)
    expect(text(sigue)).not.toContain('sesión expiró')
    expect(text(sigue)).toContain('GitHub')

    await runShell(sessionId, 'ada', IP)
    const saltaCv = await runShell(sessionId, 'ada', IP)
    expect(text(saltaCv)).toContain('Algo que hayas construido')
  })

  it('recuerda quién ya postuló aunque se reinicie', async () => {
    discordOk()
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await fill(sessionId)
    vi.setSystemTime(Date.now() + 5 * 60_000)
    await runShell(sessionId, '', IP)

    closeDb()

    const otra = greet()
    await runShell(otra.sessionId, './postular', IP)
    await fill(otra.sessionId)
    vi.setSystemTime(Date.now() + 5 * 60_000)
    const reintento = await runShell(otra.sessionId, '', IP)
    expect(text(reintento)).toContain('Ya recibimos una postulación')
  })

  it('dos personas en la misma IP no se quitan el turno', async () => {
    // Misma IP (un CGNAT, una oficina, una casa), dos sesiones distintas.
    const uno = greet()
    const dos = greet()

    await runShell(uno.sessionId, './postular', IP)
    await runShell(uno.sessionId, 'Ada Lovelace', IP)

    const otra = await runShell(dos.sessionId, './postular', IP)
    expect(text(otra)).toContain('¿Cómo te llamas?')

    // Cada sesión avanza por su cuenta.
    const sigue = await runShell(uno.sessionId, 'ada@example.com', IP)
    expect(text(sigue)).toContain('GitHub')
  })

  it('avisa si la sesión se perdió, en vez de confundir', () => {
    const reply = runAttach('sesion-que-no-existe', {
      bytes: PDF,
      name: 'cv.pdf',
      type: 'application/pdf',
    })
    expect(text(reply)).toContain('sesión expiró')
    expect(text(reply)).not.toContain('no toca adjuntar')
  })

  it('pide correr ./postular si adjuntan sin haber empezado', () => {
    const { sessionId } = greet()
    const reply = runAttach(sessionId, {
      bytes: PDF,
      name: 'cv.pdf',
      type: 'application/pdf',
    })
    expect(text(reply)).toContain('./postular')
  })

  it('rechaza un PDF que no es PDF', () => {
    const { sessionId } = greet()
    void runShell(sessionId, './postular', IP)
    const reply = runAttach(sessionId, {
      bytes: new Uint8Array([1, 2, 3, 4]),
      name: 'cv.pdf',
      type: 'application/pdf',
    })
    expect(reply.lines.some((l) => l.kind === 'err')).toBe(true)
  })

  it('se sale con :q y no envía nada', async () => {
    const fetchMock = discordOk()
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)

    const salida = await runShell(sessionId, ':q', IP)
    expect(salida.mode).toBe('shell')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('no envía si se completó sospechosamente rápido', async () => {
    const fetchMock = discordOk()
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await fill(sessionId)

    const reply = await runShell(sessionId, '', IP)
    expect(reply.mode).toBe('confirm')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('rescate desde /admin', () => {
  it('lista las postulaciones a medio terminar con su avance', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)
    await runShell(sessionId, 'ada@example.com', IP)

    const [p] = listPendingSessions()
    expect(p.id).toBe(sessionId)
    expect(p.fullName).toBe('Ada Lovelace')
    expect(p.email).toBe('ada@example.com')
    expect(p.step).toBe(3)
    expect(p.steps).toBe(8)
    expect(p.hasCv).toBe(false)
  })

  it('no muestra las que ni siquiera empezaron', () => {
    greet() // solo abrió la página
    expect(listPendingSessions()).toEqual([])
  })

  it('el enlace de rescate retoma donde quedó', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)

    // Es lo que hace /postular?s=<id>: saludar con esa sesión.
    const retomada = greet(sessionId)
    expect(text(retomada)).toContain('Retomando')
    expect(retomada.mode).toBe('field')
  })
})

describe('sesiones de una versión anterior del cuestionario', () => {
  /** Escribe a mano una sesión con el índice de otro flujo, como pasó en prod. */
  function plantSession(state: Record<string, unknown>) {
    const id = 'vieja-0000-0000-0000-000000000000'
    getDb()
      .prepare(
        `INSERT INTO sessions (id, created_at, updated_at, state, cv, cv_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, Date.now() - 600_000, Date.now(), JSON.stringify(state), PDF, 'cv.pdf')
    return id
  }

  const draftCasi = {
    fullName: 'Yhonatan',
    email: 'y@example.com',
    github: 'yhona',
    linkedin: 'yhona',
    project: 'https://github.com/y/repulink',
    answerProject: 'Construí RepuLink.',
    answerSimplicity: 'Simplifiqué el pedido.',
    answerAi: '', // nunca alcanzó a responderla
  }

  it('vuelve a preguntar lo que quedó sin responder', async () => {
    // El índice dice "ya terminaste", pero falta la pregunta de IA.
    const id = plantSession({ step: 8, draft: draftCasi, flag: false, done: false })

    const retomada = greet(id)
    expect(retomada.mode).toBe('field')
    expect(text(retomada)).toContain('Trabajo con IA')
  })

  it('no deja enviar una postulación incompleta', async () => {
    const fetchMock = discordOk()
    const id = plantSession({ step: 8, draft: draftCasi, flag: false, done: false })

    // Enter vacío no envía: primero exige la respuesta que falta.
    const intento = await runShell(id, '', IP)
    expect(text(intento)).toContain('trabajo con IA')
    expect(fetchMock).not.toHaveBeenCalled()

    // Respondiendo la que faltaba, ahora sí sale.
    await runShell(id, 'Uso IA a diario y verifico todo.', IP)
    const enviada = await runShell(id, '', IP)
    expect(enviada.mode).toBe('done')
    expect(fetchMock).toHaveBeenCalled()
  })
})

describe('sesiones guardadas con otra versión del cuestionario', () => {
  /**
   * El flujo tenía nueve pasos y ahora tiene ocho. Las sesiones guardadas
   * apuntan a un índice que ya no significa lo mismo, y eso dejó a alguien
   * "listo para enviar" con una respuesta vacía. Ningún índice viejo puede
   * volver a dejar pasar una postulación incompleta.
   */
  const FLUJO_VIEJO = [
    'fullName',
    'email',
    'github',
    'linkedin',
    'project',
    'cv',
    'answerProject',
    'answerSimplicity',
    'answerAi',
  ]

  function plantar(step: number, draft: Record<string, string>, conCv = true) {
    const id = `vieja-${step}`
    getDb()
      .prepare(
        `INSERT INTO sessions (id, created_at, updated_at, state, cv, cv_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        Date.now() - 600_000,
        Date.now(),
        JSON.stringify({
          step,
          draft: { ...EMPTY_FIELDS, ...draft },
          flag: false,
          done: false,
        }),
        conCv ? PDF : null,
        conCv ? 'cv.pdf' : null,
      )
    return id
  }

  /** Lo que llevaba escrito quien estaba en el paso N del flujo viejo. */
  function draftHasta(indice: number) {
    const draft: Record<string, string> = {}
    const valores: Record<string, string> = {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      github: 'ada',
      linkedin: 'ada',
      project: 'https://ada.dev/engine',
      answerProject: 'https://ada.dev/engine construí el motor.',
      answerSimplicity: 'Descarté los engranajes.',
      answerAi: 'Uso IA y verifico.',
    }
    for (const campo of FLUJO_VIEJO.slice(0, indice)) {
      if (campo !== 'cv') draft[campo] = valores[campo]
    }
    return draft
  }

  for (let step = 0; step <= FLUJO_VIEJO.length; step++) {
    it(`no se salta preguntas viniendo del paso viejo ${step}`, async () => {
      const fetchMock = discordOk()
      const id = plantar(step, draftHasta(step), step > 5)

      // Enter vacío: la única forma de que envíe es que no falte nada.
      const reply = await runShell(id, '', IP)

      if (reply.mode === 'done') {
        const enviado = String(
          (fetchMock.mock.calls[0][1]!.body as FormData).get('payload_json'),
        )
        for (const pregunta of [
          'Lo que construiste',
          'Ownership y simplificación',
          'Trabajo con IA',
        ]) {
          expect(enviado).toContain(pregunta)
        }
        // Ninguna sección puede quedar vacía.
        expect(enviado).not.toMatch(/\*\*Trabajo con IA\*\*\n\n/)
      } else {
        // Si no envió, tiene que estar pidiendo algo que efectivamente falta.
        expect(fetchMock).not.toHaveBeenCalled()
        expect(reply.mode).not.toBe('confirm')
      }
    })
  }

  it('el caso real: índice 8 del flujo viejo con la pregunta de IA en blanco', async () => {
    const fetchMock = discordOk()
    const id = plantar(8, { ...draftHasta(8) })

    const retomada = greet(id)
    expect(retomada.mode).toBe('field')
    expect(text(retomada)).toContain('Trabajo con IA')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('bitácora de la terminal', () => {
  it('anota los comandos y los archivos que leyó', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, 'ls', IP)
    await runShell(sessionId, 'cat README.md', IP)
    await runShell(sessionId, 'cat equipo.txt', IP)
    await runShell(sessionId, 'ls -a', IP)

    // La bitácora se puede leer desde /admin apenas empieza a postular.
    await runShell(sessionId, './postular', IP)
    const [pendiente] = listPendingSessions()
    const textos = pendiente.log.map((t) => t.text)

    expect(textos).toContain('$ ls')
    expect(textos).toContain('$ cat README.md')
    expect(textos).toContain('$ cat equipo.txt')
    expect(textos).toContain('$ ls -a')
    expect(textos).toContain('inició ./postular')
  })

  it('deja constancia de la flag y del CV', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, `./postular --flag ${FLAG_VALUE}`, IP)
    runAttach(sessionId, { bytes: PDF, name: 'mi-cv.pdf', type: 'application/pdf' })

    const textos = listPendingSessions()[0].log.map((t) => t.text)
    expect(textos).toContain('inició ./postular con la flag')
    expect(textos.some((t) => t.includes('adjuntó mi-cv.pdf'))).toBe(true)
  })

  it('no guarda las respuestas como si fueran comandos', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)
    await runShell(sessionId, 'ada@example.com', IP)

    const textos = listPendingSessions()[0].log.map((t) => t.text)
    expect(textos).not.toContain('$ Ada Lovelace')
    expect(textos).not.toContain('$ ada@example.com')
  })

  it('viaja con la postulación, junto al enlace de la grabación', async () => {
    const discord = fakeDiscord()
    const { sessionId } = greet(undefined, 'https://us.posthog.com/replay/abc?t=42')
    await runShell(sessionId, 'cat README.md', IP, 'https://us.posthog.com/replay/abc?t=42')
    await runShell(sessionId, './postular', IP)
    await fill(sessionId)
    vi.setSystemTime(Date.now() + 5 * 60_000)
    await runShell(sessionId, '', IP)

    expect(discord.text()).toContain('https://us.posthog.com/replay/abc?t=42')
  })

  it('no corta la bitácora sin límite', async () => {
    const { sessionId } = greet()
    for (let i = 0; i < 200; i++) await runShell(sessionId, `ls ${i}`, IP)
    await runShell(sessionId, './postular', IP)
    expect(listPendingSessions()[0].log.length).toBeLessThanOrEqual(120)
  })
})

describe('uso de Tab', () => {
  it('queda anotado en la bitácora', async () => {
    const { sessionId } = greet()
    completeInput(sessionId, 'cat READ')
    await runShell(sessionId, './postular', IP)

    const textos = listPendingSessions()[0].log.map((t) => t.text)
    expect(textos).toContain('⇥ cat READ → cat README.md')
  })

  it('anota también cuando había varias opciones', async () => {
    const { sessionId } = greet()
    completeInput(sessionId, 'c') // cat y clear
    await runShell(sessionId, './postular', IP)

    const [anotado] = listPendingSessions()[0].log.filter((t) =>
      t.text.startsWith('⇥'),
    )
    expect(anotado.text).toContain('cat')
    expect(anotado.text).toContain('clear')
  })

  it('no anota nada si Tab no encontró qué completar', async () => {
    const { sessionId } = greet()
    completeInput(sessionId, 'zzzz')
    await runShell(sessionId, './postular', IP)

    const tabs = listPendingSessions()[0].log.filter((t) =>
      t.text.startsWith('⇥'),
    )
    expect(tabs).toHaveLength(0)
  })

  it('viaja con la postulación', async () => {
    const discord = fakeDiscord()
    const { sessionId } = greet()
    completeInput(sessionId, 'cat equ')
    await runShell(sessionId, './postular', IP)
    await fill(sessionId)
    vi.setSystemTime(Date.now() + 5 * 60_000)
    await runShell(sessionId, '', IP)

    void discord
    // La bitácora queda guardada en la fila, no solo en la sesión.
    const { listApplications } = await import('./applications')
    const [app] = listApplications()
    expect(app.activity.some((t) => t.text.startsWith('⇥'))).toBe(true)
  })
})

describe('copiar y pegar', () => {
  it('anota en qué pregunta estaba cuando pegó', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP)
    await runShell(sessionId, 'Ada Lovelace', IP)
    await runShell(sessionId, 'ada@example.com', IP)
    await runShell(sessionId, 'ada', IP)
    await runShell(sessionId, 'ada', IP)
    runAttach(sessionId, { bytes: PDF, name: 'cv.pdf', type: 'application/pdf' })

    // Pega la respuesta de la pregunta del proyecto.
    await runShell(sessionId, 'https://ada.dev/x construí el motor.', IP, '', [
      'pegó 1100 caracteres',
    ])

    const textos = listPendingSessions()[0].log.map((t) => t.text)
    const pegado = textos.find((t) => t.startsWith('📋'))
    expect(pegado).toContain('pegó 1100 caracteres')
    expect(pegado).toContain('Algo que hayas construido')
  })

  it('anota cuando copia la pantalla', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, 'cat README.md', IP, '', [
      'copió 3200 caracteres de la pantalla',
    ])
    await runShell(sessionId, './postular', IP)

    const textos = listPendingSessions()[0].log.map((t) => t.text)
    expect(textos.some((t) => t.includes('copió 3200 caracteres'))).toBe(true)
  })

  it('no deja que el navegador nos llene la bitácora', async () => {
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP, '', [
      'a'.repeat(500), // una nota enorme
    ])

    const [nota] = listPendingSessions()[0].log.filter((t) =>
      t.text.startsWith('📋'),
    )
    // El recorte lo hace la ruta; acá se comprueba que igual queda acotado.
    expect(nota.text.length).toBeLessThan(700)
  })

  it('viaja con la postulación', async () => {
    const discord = fakeDiscord()
    const { sessionId } = greet()
    await runShell(sessionId, './postular', IP, '', ['pegó 900 caracteres'])
    await fill(sessionId)
    vi.setSystemTime(Date.now() + 5 * 60_000)
    await runShell(sessionId, '', IP)

    void discord
    const { listApplications } = await import('./applications')
    const [app] = listApplications()
    expect(app.activity.some((t) => t.text.includes('pegó 900'))).toBe(true)
  })
})
