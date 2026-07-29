import { randomUUID } from 'node:crypto'

import type { ApplicationFields } from '#/lib/application'
import { getDb } from './db'
import { inspectPdf, safeCvName } from './pdf'

/**
 * La postulación se guarda primero en nuestra base y recién después se manda a
 * Discord. Si el webhook falla, la postulación ya está a salvo y se puede
 * reenviar desde /admin: nadie pierde lo que escribió.
 */

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

/**
 * SUPPRESS_EMBEDS. Sin esto Discord arma una tarjeta de previsualización por
 * cada enlace, y entre GitHub, LinkedIn, el proyecto, el panel y la grabación
 * el canal queda inservible.
 */
const SIN_PREVISUALIZACIONES = 1 << 2

/** Para armar los enlaces que van en el mensaje de Discord. */
const SITE = process.env.SITE_URL || 'https://bipbop.cl'

/** Discord corta el mensaje en 2.000 caracteres, así que va paginado. */
const DISCORD_LIMIT = 1900
/** Más que esto no se pagina: el resto se manda como archivo adjunto. */
const MAX_CHUNKS = 4

/**
 * Detrás de una IP residencial o de un CGNAT puede haber un barrio entero, así
 * que la IP es un tope contra scripts, no el control principal. Lo que
 * realmente limita postular es el correo, que se deduplica en la base.
 *
 *   apply   postulaciones entregadas por IP. Solo cuentan las que salieron:
 *           equivocarse con el formato no gasta cuota.
 *   shell   comandos por sesión, no por IP, para que dos personas en la misma
 *           casa no se quiten el turno.
 *   origin  tope duro por IP para todo el tráfico de la terminal.
 */
const RATE_LIMIT_MAX = { apply: 20, shell: 600, origin: 5000 }
export type Bucket = keyof typeof RATE_LIMIT_MAX

/** Por dónde llegó: la terminal de /postular o el API documentado. */
export type Source = 'terminal' | 'api'

export type Trace = { at: number; text: string }

export type Meta = {
  source: Source
  flag: boolean
  /** Grabación de PostHog de cómo llenó el formulario, si está activa. */
  replayUrl?: string
  /** Qué comandos corrió y qué archivos leyó antes de postular. */
  activity?: Array<Trace>
}

export type Application = ApplicationFields &
  Meta & {
    id: string
    createdAt: string
    status: 'new'
    cvName: string
    cvSize: number
    replayUrl: string
    activity: Array<Trace>
    /** null mientras no haya llegado a Discord. */
    deliveredAt: string | null
    deliveryError: string | null
  }

/** El rate limit vive en memoria: es un freno para bots, no un registro. */
const hits = new Map<string, Array<number>>()

function recent(key: string, bucket: Bucket, now: number): Array<number> {
  const fresh = (hits.get(`${bucket}:${key}`) ?? []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS,
  )
  hits.set(`${bucket}:${key}`, fresh)
  return fresh
}

/** Consulta sin cobrar, para poder rechazar antes de hacer el trabajo. */
export function isRateLimited(
  key: string,
  bucket: Bucket,
  now = Date.now(),
): boolean {
  return recent(key, bucket, now).length >= RATE_LIMIT_MAX[bucket]
}

/** Cobra una. En "apply" se llama recién cuando la postulación se guardó. */
export function recordHit(key: string, bucket: Bucket, now = Date.now()) {
  recent(key, bucket, now).push(now)
}

export function isDuplicate(email: string, now = Date.now()): boolean {
  const row = getDb()
    .prepare('SELECT created_at FROM applications WHERE email = ?')
    .get(email.trim().toLowerCase()) as { created_at: number } | undefined
  return row !== undefined && now - row.created_at < DEDUPE_WINDOW_MS
}

export function resetState() {
  hits.clear()
  getDb().exec('DELETE FROM applications')
}

export class CvRejected extends Error {}

type Row = {
  id: string
  created_at: number
  status: string
  source: Source
  flag: number
  full_name: string
  email: string
  github: string
  linkedin: string
  project: string
  answer_project: string
  answer_simplicity: string
  answer_ai: string
  answer_case: string
  answer_ask: string
  cv_name: string
  cv_size: number
  replay_url: string | null
  activity: string | null
  delivered_at: number | null
  delivery_error: string | null
}

function toApplication(row: Row): Application {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    status: 'new',
    source: row.source,
    flag: Boolean(row.flag),
    fullName: row.full_name,
    email: row.email,
    github: row.github,
    linkedin: row.linkedin,
    project: row.project,
    answerProject: row.answer_project,
    answerSimplicity: row.answer_simplicity,
    answerAi: row.answer_ai,
    answerCase: row.answer_case,
    answerAsk: row.answer_ask,
    cvName: row.cv_name,
    cvSize: row.cv_size,
    replayUrl: row.replay_url ?? '',
    activity: row.activity ? (JSON.parse(row.activity) as Array<Trace>) : [],
    deliveredAt: row.delivered_at
      ? new Date(row.delivered_at).toISOString()
      : null,
    deliveryError: row.delivery_error,
  }
}

const COLUMNS = `id, created_at, status, source, flag, full_name, email, github,
  linkedin, project, answer_project, answer_simplicity, answer_ai, answer_case,
  answer_ask, cv_name, cv_size, replay_url, activity, delivered_at,
  delivery_error`

export function listApplications(): Array<Application> {
  return (
    getDb()
      .prepare(`SELECT ${COLUMNS} FROM applications ORDER BY created_at DESC`)
      .all() as Array<Row>
  ).map(toApplication)
}

export function getCv(
  id: string,
): { bytes: Uint8Array; name: string } | undefined {
  const row = getDb()
    .prepare('SELECT cv, cv_name FROM applications WHERE id = ?')
    .get(id) as { cv: Uint8Array; cv_name: string } | undefined
  return row ? { bytes: row.cv, name: row.cv_name } : undefined
}

/**
 * El mensaje ES el registro. Empieza con aire y un título grande para que en
 * el canal se note entre la conversación, y las respuestas van citadas para
 * que se distinga lo que escribió la persona de lo que ponemos nosotros.
 */
function discordMessage(app: Application): string {
  const cuando = new Date(app.createdAt).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'short',
    timeStyle: 'short',
  })

  const marcas = [
    app.source === 'api' ? '🤖 por API, con agente' : '⌨️ por la terminal',
    ...(app.flag ? ['🔑 encontró la flag'] : []),
    cuando,
  ]

  /**
   * Citado: así el markdown que escriba el postulante no rompe el mensaje.
   * Los saltos llegan como \r\n desde el multipart, hay que contemplarlo.
   */
  const citar = (texto: string) =>
    texto
      .split(/\r?\n/)
      .map((linea) => `> ${linea}`)
      .join('\n')

  // Discord recorta el espacio del principio, así que el aire se hace con un
  // carácter invisible (braille en blanco) en su propia línea.
  const aire = '⠀'

  return [
    aire,
    '# 🐧 ALERTA, NUEVO POSTULANTE',
    '',
    `## ${app.fullName}`,
    app.email,
    `-# ${marcas.join(' · ')}`,
    `-# 🔎 [abrir en el panel](${SITE}/admin?a=${app.id})${
      app.replayUrl ? ` · 🎥 [ver cómo lo llenó](${app.replayUrl})` : ''
    }`,
    '',
    `**GitHub** ${app.github}`,
    `**LinkedIn** ${app.linkedin}`,
    `**Proyecto** ${app.project}`,
    '',
    '### Lo que construiste',
    citar(app.answerProject),
    '',
    '### Ownership y simplificación',
    citar(app.answerSimplicity),
    '',
    '### Trabajo con IA',
    citar(app.answerAi),
    '',
    '### El caso',
    citar(app.answerCase),
    '',
    '### Lo que nos preguntaría',
    citar(app.answerAsk),
    '',
    `-# ${app.status} · ${app.id}`,
  ].join('\n')
}

/**
 * Corta el mensaje en pedazos que Discord acepte, respetando los saltos de
 * línea. Una línea más larga que el tope se parte a la fuerza.
 */
export function paginate(text: string, limit = DISCORD_LIMIT): Array<string> {
  const chunks: Array<string> = []
  let current = ''

  for (const line of text.split('\n')) {
    for (const piece of line.length > limit ? hardSplit(line, limit) : [line]) {
      if (current && current.length + 1 + piece.length > limit) {
        chunks.push(current)
        current = piece
      } else {
        current = current ? `${current}\n${piece}` : piece
      }
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function hardSplit(line: string, limit: number): Array<string> {
  const out: Array<string> = []
  for (let i = 0; i < line.length; i += limit) out.push(line.slice(i, i + limit))
  return out
}

/** Manda la postulación al webhook, paginada, con el CV en el primer mensaje. */
async function deliver(app: Application, cv: Uint8Array): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL
  if (!webhook) throw new Error('DISCORD_WEBHOOK_URL no está configurado')

  const full = discordMessage(app)
  const all = paginate(full)

  // Si son demasiados pedazos, no inundamos el canal: va el resto adjunto.
  const overflow = all.length > MAX_CHUNKS
  const chunks = overflow ? all.slice(0, 1) : all
  const url = new URL(webhook)

  for (const [index, chunk] of chunks.entries()) {
    const content =
      chunks.length > 1
        ? `${chunk}\n-# ${index + 1}/${chunks.length} · ${app.id}`
        : chunk

    const body = new FormData()
    body.append(
      'payload_json',
      JSON.stringify({
        content,
        allowed_mentions: { parse: [] },
        flags: SIN_PREVISUALIZACIONES,
      }),
    )

    // El CV va con el primero, para que quede junto a los datos.
    if (index === 0) {
      body.append(
        'files[0]',
        new Blob([cv as BufferSource], { type: 'application/pdf' }),
        safeCvName(app.fullName),
      )
      if (overflow) {
        body.append(
          'files[1]',
          new Blob([full], { type: 'text/markdown' }),
          `postulacion-${app.id}.md`,
        )
      }
    }

    await send(url, body, app.id)
  }
}

/** Un POST al webhook, respetando el rate limit de Discord. */
async function send(url: URL, body: FormData, id: string, intento = 1) {
  const res = await fetch(url, { method: 'POST', body })

  if (res.status === 429 && intento <= 3) {
    const payload = (await res.json().catch(() => ({}))) as {
      retry_after?: number
    }
    const espera = Math.min((payload.retry_after ?? 1) * 1000, 10_000)
    console.warn(`[applications] Discord pidió esperar ${espera}ms (${id})`)
    await new Promise((r) => setTimeout(r, espera))
    return send(url, body, id, intento + 1)
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`webhook respondió ${res.status}: ${detail.slice(0, 300)}`)
  }
}

/** Intenta entregar y deja anotado cómo le fue. */
async function tryDeliver(app: Application, cv: Uint8Array): Promise<boolean> {
  try {
    await deliver(app, cv)
    getDb()
      .prepare(
        'UPDATE applications SET delivered_at = ?, delivery_error = NULL WHERE id = ?',
      )
      .run(Date.now(), app.id)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[applications] no se pudo entregar ${app.id}: ${message}`)
    getDb()
      .prepare('UPDATE applications SET delivery_error = ? WHERE id = ?')
      .run(message, app.id)
    return false
  }
}

/**
 * Guarda la postulación y después la manda a Discord. Solo falla si el PDF no
 * sirve: una vez guardada, la persona ya cumplió su parte.
 */
export async function submitApplication(
  fields: ApplicationFields,
  cv: { bytes: Uint8Array; name: string },
  meta: Meta,
): Promise<Application> {
  const problem = inspectPdf(cv.bytes)
  if (problem) throw new CvRejected(problem)

  const id = randomUUID()
  const createdAt = Date.now()

  getDb()
    .prepare(
      `INSERT INTO applications (
         id, created_at, status, source, flag, full_name, email, github,
         linkedin, project, answer_project, answer_simplicity, answer_ai,
         answer_case, answer_ask, cv, cv_name, cv_size, replay_url, activity
       ) VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      createdAt,
      meta.source,
      meta.flag ? 1 : 0,
      fields.fullName,
      fields.email,
      fields.github,
      fields.linkedin,
      fields.project,
      fields.answerProject,
      fields.answerSimplicity,
      fields.answerAi,
      fields.answerCase,
      fields.answerAsk,
      cv.bytes,
      cv.name,
      cv.bytes.byteLength,
      meta.replayUrl ?? '',
      JSON.stringify(meta.activity ?? []),
    )

  const app = toApplication(
    getDb()
      .prepare(`SELECT ${COLUMNS} FROM applications WHERE id = ?`)
      .get(id) as Row,
  )

  await tryDeliver(app, cv.bytes)
  return app
}

/** Reintento manual desde /admin, para lo que se quedó sin entregar. */
export async function redeliver(id: string): Promise<boolean> {
  const row = getDb()
    .prepare(`SELECT ${COLUMNS} FROM applications WHERE id = ?`)
    .get(id) as Row | undefined
  const cv = getCv(id)
  if (!row || !cv) return false
  return tryDeliver(toApplication(row), cv.bytes)
}
