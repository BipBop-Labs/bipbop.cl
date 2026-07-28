import { mkdtemp, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_FIELDS } from '#/lib/application'
import { Route } from '#/routes/api.applications'
import { Route as Route_admin } from '#/routes/api.admin'
import { listApplications, redeliver, resetState } from './applications'
import { closeDb } from './db'

const POST = (
  Route.options.server!.handlers as unknown as {
    POST: (ctx: { request: Request }) => Promise<Response>
  }
).POST

/** PDF mínimo válido: cabecera + marcador de fin. */
const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n')

const WEBHOOK = 'https://discord.test/webhook'

const fields = {
  ...EMPTY_FIELDS,
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  github: 'https://github.com/ada',
  linkedin: 'https://linkedin.com/in/ada',
  project: 'https://ada.dev/engine',
  answerProject: 'Construí el motor.',
  answerSimplicity: 'Descarté los engranajes extra.',
  answerAi: 'Uso IA y verifico cada resultado.',
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

function submit(
  overrides: Partial<Record<string, string>> = {},
  file: { bytes: Uint8Array; name: string; type: string } | null = {
    bytes: PDF,
    name: 'cv.pdf',
    type: 'application/pdf',
  },
) {
  const body = new FormData()
  for (const [key, value] of Object.entries({ ...fields, ...overrides })) {
    body.append(key, value as string)
  }
  if (!('startedAt' in overrides)) {
    body.append('startedAt', String(Date.now() - 10_000))
  }
  if (file) {
    body.append(
      'cv',
      new Blob([file.bytes as BufferSource], { type: file.type }),
      file.name,
    )
  }
  return POST({
    request: new Request('http://localhost/api/applications', {
      method: 'POST',
      body,
      headers: { 'x-forwarded-for': '203.0.113.10' },
    }),
  })
}

/** Lo que efectivamente se mandó al webhook en la última llamada. */
function lastUpload(fetchMock: ReturnType<typeof discordOk>) {
  const [url, init] = fetchMock.mock.calls.at(-1)!
  return { url: String(url), form: init!.body as FormData }
}

async function tempCvDirs() {
  const entries = await readdir(tmpdir())
  return entries.filter((name) => name.startsWith('bipbop-cv-'))
}

beforeEach(async () => {
  closeDb()
  process.env.DATA_DIR = await mkdtemp(join(tmpdir(), 'bipbop-db-'))
  process.env.DISCORD_WEBHOOK_URL = WEBHOOK
  resetState()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/applications', () => {
  it('entrega la postulación completa a Discord', async () => {
    const fetchMock = discordOk()
    const res = await submit()

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true })
    expect(fetchMock).toHaveBeenCalledOnce()

    const { url, form } = lastUpload(fetchMock)
    expect(url).toContain(WEBHOOK)

    // El mensaje lleva los datos, el estado y un id.
    const payload = String(form.get('payload_json'))
    expect(payload).toContain('Ada Lovelace')
    expect(payload).toContain('ada@example.com')
    expect(payload).toContain('https://github.com/ada')
    expect(payload).toContain('https://linkedin.com/in/ada')
    expect(payload).toContain('Construí el motor.')
    expect(payload).toContain('new')
    expect(payload).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/) // el id

    const attachment = form.get('files[0]') as File
    expect(attachment).toBeInstanceOf(Blob)
    expect(attachment.name).toBe('cv-ada-lovelace.pdf') // nunca el nombre subido
  })

  it('no deja rastro del CV en el servidor', async () => {
    discordOk()
    await submit()
    expect(await tempCvDirs()).toEqual([])
  })

  it('normaliza los enlaces sin esquema antes de enviarlos', async () => {
    const fetchMock = discordOk()
    await submit({ github: 'github.com/ada', project: 'ada.dev/engine' })

    const payload = String(lastUpload(fetchMock).form.get('payload_json'))
    expect(payload).toContain('https://github.com/ada')
    expect(payload).toContain('https://ada.dev/engine')
  })

  it('devuelve 400 con los errores por campo', async () => {
    const res = await submit({ github: 'https://gitlab.com/ada' })
    expect(res.status).toBe(400)
    expect((await res.json()).errors.github).toBeDefined()
  })

  it('exige el CV', async () => {
    const res = await submit({}, null)
    expect(res.status).toBe(400)
    expect((await res.json()).errors.cv).toBeDefined()
  })

  it('rechaza un archivo que no es PDF de verdad', async () => {
    const fetchMock = discordOk()
    const res = await submit(
      {},
      {
        bytes: new Uint8Array([1, 2, 3, 4]),
        name: 'cv.pdf',
        type: 'application/pdf',
      },
    )
    expect(res.status).toBe(400)
    expect((await res.json()).errors.cv).toBeDefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rechaza un PDF con contenido activo', async () => {
    discordOk()
    const malicious = new TextEncoder().encode(
      '%PDF-1.7\n/OpenAction << /S /JavaScript >>\n%%EOF\n',
    )
    const res = await submit(
      {},
      { bytes: malicious, name: 'cv.pdf', type: 'application/pdf' },
    )
    expect(res.status).toBe(400)
    expect((await res.json()).errors.cv).toContain('contenido activo')
  })

  it('rechaza el mismo correo dos veces', async () => {
    const fetchMock = discordOk()
    expect((await submit()).status).toBe(200)

    const res = await submit({ email: 'ADA@example.com' }) // sin distinguir mayúsculas
    expect(res.status).toBe(409)
    expect(fetchMock).toHaveBeenCalledOnce()
  })



  it('no gasta cuota en los intentos que rechazamos', async () => {
    discordOk()
    // Un agente afinando el formato se equivoca muchas veces seguidas.
    for (let i = 0; i < 25; i++) {
      await submit({ github: 'https://gitlab.com/ada' })
    }
    // Y aun así puede postular: solo cuentan las entregadas.
    expect((await submit()).status).toBe(200)
  })

  it('corta cuando una IP entrega demasiadas postulaciones', async () => {
    discordOk()
    for (let i = 0; i < 20; i++) await submit({ email: `ada${i}@example.com` })
    const res = await submit({ email: 'otro@example.com' })
    expect(res.status).toBe(429)
  })

  it('guarda la postulación aunque Discord falle, y la deja reenviable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('caído'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Para quien postula, salió bien: lo suyo ya está guardado.
    expect((await submit()).status).toBe(200)

    const [app] = listApplications()
    expect(app.deliveredAt).toBeNull()
    expect(app.deliveryError).toContain('caído')
    expect(app.fullName).toBe('Ada Lovelace')

    // Y desde /admin se puede reenviar cuando el webhook vuelva.
    vi.restoreAllMocks()
    const fetchMock = discordOk()
    expect(await redeliver(app.id)).toBe(true)
    expect(fetchMock).toHaveBeenCalled()
    expect(listApplications()[0].deliveredAt).not.toBeNull()
  })

  it('pagina los mensajes largos en vez de que Discord los rechace', async () => {
    const fetchMock = discordOk()
    const largo = 'a'.repeat(1200)
    await submit({
      answerProject: largo,
      answerSimplicity: largo,
      answerAi: largo,
    })

    // Tres respuestas de 1.200 no caben en un mensaje de 2.000.
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
    for (const [, init] of fetchMock.mock.calls) {
      const payload = JSON.parse(
        String((init!.body as FormData).get('payload_json')),
      )
      expect(payload.content.length).toBeLessThanOrEqual(2000)
    }

    // Nada se recortó: el texto completo viaja repartido.
    const todo = fetchMock.mock.calls
      .map(([, init]) =>
        JSON.parse(String((init!.body as FormData).get('payload_json'))).content,
      )
      .join('')
    expect(todo).toContain(largo)
  })
})

describe('POST /api/admin', () => {
  const ADMIN = (
    Route_admin.options.server!.handlers as unknown as {
      POST: (ctx: { request: Request }) => Promise<Response>
    }
  ).POST

  const call = (body: Record<string, unknown>) =>
    ADMIN({
      request: new Request('http://localhost/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    })

  it('queda cerrado si no hay ADMIN_KEY configurada', async () => {
    delete process.env.ADMIN_KEY
    expect((await call({ action: 'list', key: '' })).status).toBe(401)
    expect((await call({ action: 'list', key: 'loquesea' })).status).toBe(401)
  })

  it('rechaza una llave equivocada', async () => {
    process.env.ADMIN_KEY = 'una-llave-suficientemente-larga'
    expect((await call({ action: 'list', key: 'otra' })).status).toBe(401)
  })

  it('lista las postulaciones y entrega el CV', async () => {
    process.env.ADMIN_KEY = 'una-llave-suficientemente-larga'
    discordOk()
    await submit()

    const res = await call({ action: 'list', key: process.env.ADMIN_KEY })
    const data = await res.json()
    expect(data.applications).toHaveLength(1)
    expect(data.applications[0].fullName).toBe('Ada Lovelace')
    // El CV no viaja en el listado.
    expect(JSON.stringify(data)).not.toContain('%PDF')

    const cv = await call({
      action: 'cv',
      id: data.applications[0].id,
      key: process.env.ADMIN_KEY,
    })
    expect(cv.headers.get('content-type')).toBe('application/pdf')
    expect(new Uint8Array(await cv.arrayBuffer())).toEqual(PDF)
  })
})

describe('postulaciones enormes', () => {
  it('manda el texto como adjunto en vez de inundar el canal', async () => {
    const fetchMock = discordOk()
    // Lo más largo que la validación permite: 3 respuestas de 1.200.
    const max = 'a'.repeat(1200)
    await submit({
      answerProject: max,
      answerSimplicity: max,
      answerAi: max,
    })

    // Pocos mensajes, y el texto completo viaja como archivo.
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4)
    const primero = fetchMock.mock.calls[0][1]!.body as FormData
    const adjuntos = [...primero.keys()].filter((k) => k.startsWith('files['))
    expect(adjuntos.length).toBeGreaterThanOrEqual(1)
  })

  it('reintenta cuando Discord pide esperar', async () => {
    let llamadas = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      llamadas += 1
      if (llamadas === 1) {
        return Response.json({ retry_after: 0.01 }, { status: 429 })
      }
      return Response.json({ id: '1', attachments: [] })
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await submit()
    const [app] = listApplications()
    expect(app.deliveredAt).not.toBeNull()
    expect(llamadas).toBeGreaterThan(1)
  })
})
