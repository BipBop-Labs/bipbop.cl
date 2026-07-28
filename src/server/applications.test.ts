import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_FIELDS } from '#/lib/application'
import { Route } from '#/routes/api.applications'
import { resetRateLimit } from './applications'

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

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bipbop-apps-'))
  process.env.DATA_DIR = dir
  process.env.DISCORD_WEBHOOK_URL = WEBHOOK
  resetRateLimit()
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function storedRecords() {
  const raw = await readFile(join(dir, 'applications.jsonl'), 'utf8')
  return raw.split('\n').filter(Boolean).map((l) => JSON.parse(l))
}

async function tempCvDirs() {
  const entries = await readdir(tmpdir())
  return entries.filter((name) => name.startsWith('bipbop-cv-'))
}

describe('POST /api/applications', () => {
  it('entrega la postulación y guarda el registro', async () => {
    discordOk()
    const res = await submit()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true })

    const [record] = await storedRecords()
    expect(record).toMatchObject({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      github: 'https://github.com/ada',
      status: 'new',
    })
    expect(record.id).toBeTruthy()
    expect(Date.parse(record.createdAt)).not.toBeNaN()

    // El CV vive en Discord, no en el registro ni en el servidor.
    expect(record.cv).toMatchObject({
      url: 'https://cdn.discord.test/cv.pdf',
      messageId: '123456789',
      originalName: 'cv.pdf',
    })
    expect(JSON.stringify(record)).not.toContain('%PDF')
  })

  it('borra la carpeta temporal del CV', async () => {
    discordOk()
    const before = await tempCvDirs()
    await submit()
    expect(await tempCvDirs()).toEqual(before)
  })

  it('sube el PDF al webhook con un nombre que ponemos nosotros', async () => {
    const fetchMock = discordOk()
    await submit()

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain(WEBHOOK)
    expect(String(url)).toContain('wait=true')

    const sent = init!.body as FormData
    expect(String(sent.get('payload_json'))).toContain('ada@example.com')
    const attachment = sent.get('files[0]') as File
    expect(attachment).toBeInstanceOf(Blob)
    expect(attachment.name).toBe('cv-ada-lovelace.pdf')
  })

  it('normaliza los enlaces sin esquema', async () => {
    discordOk()
    await submit({ github: 'github.com/ada', project: 'ada.dev/engine' })
    const [record] = await storedRecords()
    expect(record.github).toBe('https://github.com/ada')
    expect(record.project).toBe('https://ada.dev/engine')
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
    discordOk()
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
    discordOk()
    expect((await submit()).status).toBe(200)
    const res = await submit()
    expect(res.status).toBe(409)
    expect(await storedRecords()).toHaveLength(1)
  })

  it('descarta los envíos que caen en el honeypot', async () => {
    const res = await submit({ website: 'https://spam.example' })
    expect(res.status).toBe(200)
    await expect(storedRecords()).rejects.toThrow() // no se guardó nada
  })

  it('rechaza los envíos instantáneos', async () => {
    const res = await submit({ startedAt: String(Date.now()) })
    expect(res.status).toBe(400)
  })

  it('limita la cantidad de envíos por IP', async () => {
    discordOk()
    for (let i = 0; i < 5; i++) await submit({ email: `ada${i}@example.com` })
    const res = await submit({ email: 'ada6@example.com' })
    expect(res.status).toBe(429)
  })

  it('no guarda nada si la entrega falla, para que se pueda reintentar', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('caído'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await submit()
    expect(res.status).toBe(502)
    await expect(storedRecords()).rejects.toThrow()
    expect(await tempCvDirs()).toEqual([])
  })
})
