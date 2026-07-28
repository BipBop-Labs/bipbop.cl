import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetState } from './applications'
import { closeDb } from './db'
import { completeInput, greet, resetSessions, runAttach, runShell } from './shell'
import { FLAG_VALUE } from './shell-files'

/** PDF mínimo válido. */
const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n')
const IP = '203.0.113.10'

function text(reply: { lines: Array<{ text: string }> }) {
  return reply.lines.map((l) => l.text).join('\n')
}

function discordOk() {
  // Una Response nueva por llamada: el body solo se puede leer una vez.
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    Response.json({
      id: '123456789',
      attachments: [{ url: 'https://cdn.discord.test/cv.pdf' }],
    }),
  )
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

describe('postulación', () => {
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
    expect(payload).toContain('vía terminal')
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
