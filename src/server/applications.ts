import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { ApplicationFields } from '#/lib/application'
import { inspectPdf, safeCvName } from './pdf'

/**
 * Discord es la fuente de verdad: la postulación completa, con el CV adjunto,
 * vive en el canal del equipo. El servidor no guarda nada — el PDF pasa por una
 * carpeta temporal que se borra apenas se sube.
 */

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 5

export type Application = ApplicationFields & {
  id: string
  createdAt: string
  status: 'new'
  cv: { url: string; messageId: string; originalName: string; size: number }
}

/**
 * Ventanas deslizantes en memoria. Se pierden al reiniciar, y está bien: son
 * un freno para bots y dedos apurados, no un registro.
 */
const hits = new Map<string, Array<number>>()
const applied = new Map<string, number>()

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

export function isDuplicate(email: string, now = Date.now()): boolean {
  const last = applied.get(email.toLowerCase())
  return last !== undefined && now - last < DEDUPE_WINDOW_MS
}

export function resetState() {
  hits.clear()
  applied.clear()
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
  id: string,
  createdAt: string,
): string {
  const trim = (text: string) =>
    text.length > 900 ? `${text.slice(0, 900)}…` : text

  return [
    '**Nueva postulación · Software Engineer**',
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
): Promise<Application> {
  const id = randomUUID()
  const createdAt = new Date().toISOString()

  const attachment = await deliverCv(
    cv.bytes,
    fields,
    discordMessage(fields, id, createdAt),
  )

  applied.set(fields.email.toLowerCase(), Date.now())

  return {
    ...fields,
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
