import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_FIELDS } from '#/lib/application'
import { Route } from '#/routes/api.applications'
import { resetState } from './applications'

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
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
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

beforeEach(() => {
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
    expect(url).toContain('wait=true') // necesario para recibir el adjunto

    // El mensaje ES el registro: lleva los datos, el estado y un id.
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



  it('limita la cantidad de envíos por IP', async () => {
    discordOk()
    for (let i = 0; i < 5; i++) await submit({ email: `ada${i}@example.com` })
    const res = await submit({ email: 'ada6@example.com' })
    expect(res.status).toBe(429)
  })

  it('deja reintentar si la entrega falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('caído'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect((await submit()).status).toBe(502)
    expect(await tempCvDirs()).toEqual([])

    // No quedó marcado como postulado: el mismo correo puede volver a intentar.
    vi.restoreAllMocks()
    discordOk()
    expect((await submit()).status).toBe(200)
  })
})
