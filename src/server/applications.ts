import { createHash, randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { ApplicationFields } from '#/lib/application'
import { getDb } from './db'
import { inspectPdf, safeCvName } from './pdf'

/**
 * Discord es la fuente de verdad: la postulación completa, con el CV adjunto,
 * vive en el canal del equipo. El servidor no guarda nada: el PDF pasa por una
 * carpeta temporal que se borra apenas se sube.
 */

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

/**
 * Dos cuotas distintas. Postular es raro y caro; escribir en la terminal es
 * constante y barato, así que no pueden compartir el mismo contador.
 */
const RATE_LIMIT_MAX = { apply: 5, shell: 400 }
export type Bucket = keyof typeof RATE_LIMIT_MAX

/** Por dónde llegó: la terminal de /postular o el API documentado. */
export type Source = 'terminal' | 'api'

export type Meta = { source: Source; flag: boolean }

export type Application = ApplicationFields &
  Meta & {
    id: string
    createdAt: string
    status: 'new'
    cv: { url: string; messageId: string; originalName: string; size: number }
  }

/**
 * El rate limit vive en memoria y se pierde al reiniciar: es un freno para
 * bots, no un registro. La deduplicación sí persiste, para que un redespliegue
 * no habilite postular dos veces.
 */
const hits = new Map<string, Array<number>>()

/** Guardamos el hash, no el correo. */
function emailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

export function checkRateLimit(
  ip: string,
  bucket: Bucket = 'apply',
  now = Date.now(),
): boolean {
  const key = `${bucket}:${ip}`
  const recent = (hits.get(key) ?? []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS,
  )
  if (recent.length >= RATE_LIMIT_MAX[bucket]) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

export function isDuplicate(email: string, now = Date.now()): boolean {
  const row = getDb()
    .prepare('SELECT created_at FROM applied WHERE email_hash = ?')
    .get(emailHash(email)) as { created_at: number } | undefined
  return row !== undefined && now - row.created_at < DEDUPE_WINDOW_MS
}

function markApplied(email: string) {
  getDb()
    .prepare(
      `INSERT INTO applied (email_hash, created_at) VALUES (?, ?)
       ON CONFLICT(email_hash) DO UPDATE SET created_at = excluded.created_at`,
    )
    .run(emailHash(email), Date.now())
}

export function resetState() {
  hits.clear()
  getDb().exec('DELETE FROM applied')
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
  message: string,
): Promise<DiscordAttachment> {
  const dir = await mkdtemp(join(tmpdir(), 'bipbop-cv-'))
  try {
    const filename = safeCvName(fields.fullName)
    const path = join(dir, filename)
    await writeFile(path, bytes, { mode: 0o600 })

    // Se relee desde el disco: lo que revisamos es exactamente lo que se sube.
    // Va antes que cualquier cosa de infraestructura: primero el archivo.
    const stored = new Uint8Array(await readFile(path))
    const problem = inspectPdf(stored)
    if (problem) throw new CvRejected(problem)

    const webhook = process.env.DISCORD_WEBHOOK_URL
    if (!webhook)
      throw new DeliveryFailed('DISCORD_WEBHOOK_URL no está configurado')

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
      throw new CvRejected(
        'El PDF es demasiado pesado para enviarlo. Intenta con uno más liviano.',
      )
    }
    if (!res.ok) {
      throw new DeliveryFailed(`webhook respondió ${res.status}`)
    }

    const payload = (await res.json()) as {
      id: string
      attachments?: Array<{ url: string }>
    }
    return { id: payload.id, url: payload.attachments?.[0]?.url ?? '' }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** El mensaje ES el registro: lleva todo, incluidos id, fecha y estado. */
function discordMessage(
  fields: ApplicationFields,
  meta: Meta,
  id: string,
  createdAt: string,
): string {
  const trim = (text: string) =>
    text.length > 900 ? `${text.slice(0, 900)}…` : text

  const badges = [
    meta.source === 'api' ? '🤖 vía API (agente)' : '⌨️ vía terminal',
    ...(meta.flag ? ['🔑 encontró la flag'] : []),
  ]

  return [
    '**Nueva postulación · Software Engineer**',
    badges.join(' · '),
    `**${fields.fullName}** · ${fields.email}`,
    `GitHub: ${fields.github}`,
    `LinkedIn: ${fields.linkedin}`,
    `Proyecto: ${fields.project}`,
    '',
    '**Lo que construiste**',
    trim(fields.answerProject),
    '',
    '**Ownership y simplificación**',
    trim(fields.answerSimplicity),
    '',
    '**Trabajo con IA**',
    trim(fields.answerAi),
    '',
    `\`new\` · \`${id}\` · ${createdAt}`,
  ].join('\n')
}

/**
 * Entrega la postulación a Discord. Si falla no se marca nada, así la persona
 * puede reintentar sin chocar con la deduplicación.
 */
export async function submitApplication(
  fields: ApplicationFields,
  cv: { bytes: Uint8Array; name: string },
  meta: Meta,
): Promise<Application> {
  const id = randomUUID()
  const createdAt = new Date().toISOString()

  const attachment = await deliverCv(
    cv.bytes,
    fields,
    discordMessage(fields, meta, id, createdAt),
  )

  markApplied(fields.email)

  return {
    ...fields,
    ...meta,
    id,
    createdAt,
    status: 'new',
    cv: {
      url: attachment.url,
      messageId: attachment.id,
      originalName: cv.name,
      size: cv.bytes.byteLength,
    },
  }
}
