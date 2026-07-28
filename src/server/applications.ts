import { randomUUID } from 'node:crypto'
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import type { ApplicationFields } from '#/lib/application'
import { inspectPdf, safeCvName } from './pdf'

/**
 * El CV nunca se queda en el servidor: se escribe en una carpeta temporal, se
 * verifica que sea un PDF sano, se sube a Discord y la carpeta se borra. Lo
 * único que persiste es el registro en JSONL, con el enlace de Discord como
 * referencia al archivo.
 */

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 5

export type StoredApplication = ApplicationFields & {
  id: string
  createdAt: string
  status: 'new'
  cv: { url: string; messageId: string; originalName: string; size: number }
}

function dataDir(): string {
  return process.env.DATA_DIR || './data'
}

function recordsPath(): string {
  return join(dataDir(), 'applications.jsonl')
}

/** Ventana deslizante en memoria; suficiente para un servidor de un proceso. */
const hits = new Map<string, Array<number>>()

export function checkRateLimit(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS,
  )
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent)
    return false
  }
  recent.push(now)
  hits.set(ip, recent)
  return true
}

export function resetRateLimit() {
  hits.clear()
}

async function readRecords(): Promise<Array<StoredApplication>> {
  try {
    const raw = await readFile(recordsPath(), 'utf8')
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as StoredApplication)
  } catch {
    return []
  }
}

/** true si ese correo ya postuló dentro de la ventana de deduplicación. */
export async function isDuplicate(
  email: string,
  now = Date.now(),
): Promise<boolean> {
  const records = await readRecords()
  return records.some(
    (r) =>
      r.email === email.toLowerCase() &&
      now - Date.parse(r.createdAt) < DEDUPE_WINDOW_MS,
  )
}

export class CvRejected extends Error {}
export class DeliveryFailed extends Error {}

type DiscordAttachment = { id: string; url: string }

/**
 * Escribe el PDF en una carpeta temporal, lo revisa y lo sube al webhook.
 * La carpeta se borra siempre, salga bien o mal.
 */
async function deliverCv(
  bytes: Uint8Array,
  fields: ApplicationFields,
  id: string,
  message: string,
): Promise<DiscordAttachment> {
  const webhook = process.env.DISCORD_WEBHOOK_URL
  if (!webhook) throw new DeliveryFailed('DISCORD_WEBHOOK_URL no está configurado')

  const dir = await mkdtemp(join(tmpdir(), 'bipbop-cv-'))
  try {
    const filename = safeCvName(fields.fullName)
    const path = join(dir, filename)
    await writeFile(path, bytes, { mode: 0o600 })

    // Se relee desde el disco: lo que revisamos es exactamente lo que se sube.
    const stored = new Uint8Array(await readFile(path))
    const problem = inspectPdf(stored)
    if (problem) throw new CvRejected(problem)

    const body = new FormData()
    body.append(
      'payload_json',
      JSON.stringify({ content: message, allowed_mentions: { parse: [] } }),
    )
    body.append(
      'files[0]',
      new Blob([stored as BufferSource], { type: 'application/pdf' }),
      filename,
    )

    const url = new URL(webhook)
    url.searchParams.set('wait', 'true') // necesitamos el enlace del adjunto

    const res = await fetch(url, { method: 'POST', body })
    if (res.status === 413) {
      throw new CvRejected('El PDF es demasiado pesado para enviarlo. Intenta con uno más liviano.')
    }
    if (!res.ok) {
      throw new DeliveryFailed(`webhook respondió ${res.status}`)
    }

    const payload = (await res.json()) as {
      id: string
      attachments?: Array<{ url: string }>
    }
    return {
      id: payload.id,
      url: payload.attachments?.[0]?.url ?? '',
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function discordMessage(fields: ApplicationFields, id: string): string {
  const trim = (text: string) =>
    text.length > 900 ? `${text.slice(0, 900)}…` : text

  return [
    '**Nueva postulación · Software Engineer**',
    `**${fields.fullName}** · ${fields.email}`,
    `GitHub: ${fields.github}`,
    `LinkedIn: ${fields.linkedin}`,
    `Proyecto: ${fields.project}`,
    '',
    '**Proyecto compartido**',
    trim(fields.answerProject),
    '',
    '**Simplificación**',
    trim(fields.answerSimplicity),
    '',
    '**Uso de IA**',
    trim(fields.answerAi),
    '',
    `\`${id}\``,
  ].join('\n')
}

/**
 * Entrega la postulación y deja el registro. Si Discord falla no se guarda
 * nada: preferimos que la persona reintente antes que perder su CV.
 */
export async function submitApplication(
  fields: ApplicationFields,
  cv: { bytes: Uint8Array; name: string },
): Promise<StoredApplication> {
  const id = randomUUID()
  const attachment = await deliverCv(
    cv.bytes,
    fields,
    id,
    discordMessage(fields, id),
  )

  const record: StoredApplication = {
    ...fields,
    id,
    createdAt: new Date().toISOString(),
    status: 'new',
    cv: {
      url: attachment.url,
      messageId: attachment.id,
      originalName: cv.name,
      size: cv.bytes.byteLength,
    },
  }

  await mkdir(dirname(recordsPath()), { recursive: true })
  await appendFile(recordsPath(), `${JSON.stringify(record)}\n`, 'utf8')
  return record
}
