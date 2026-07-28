import { randomUUID } from 'node:crypto'

import {
  GITHUB_PREFIX,
  LINKEDIN_PREFIX,
  MAX_ANSWER_LENGTH,
  EMPTY_FIELDS,
  fromHandle,
  normalizeFields,
  validate,
  validateCv,
} from '#/lib/application'
import type { ApplicationFields, FieldName } from '#/lib/application'
import {
  CvRejected,
  isDuplicate,
  isRateLimited,
  recordHit,
  submitApplication,
} from './applications'
import {
  AGENTS,
  FILES,
  HELP,
  FLAG_VALUE,
  POSTULAR_HELP,
} from './shell-files'
import { getDb } from './db'
import { inspectPdf } from './pdf'

/**
 * La terminal de /postular corre acá. El cliente solo manda lo que se
 * escribió y pinta las líneas que devolvemos: los comandos, los archivos, la
 * flag y el orden de las preguntas no salen nunca en el bundle.
 */

export type Line = {
  kind: 'in' | 'out' | 'err' | 'ok' | 'muted' | 'head' | 'file'
  text: string
  /** Solo en el eco: el prompt que estaba activo cuando se escribió. */
  prompt?: string
}

/** Cambia en cada arranque del servidor, o sea en cada despliegue. */
const VERSION = randomUUID().slice(0, 8)

export type ShellReply = {
  sessionId: string
  /** Para que el cliente note un despliegue en medio. */
  version: string
  lines: Array<Line>
  /** Lo que se muestra pegado al cursor, por ejemplo "$" o "github.com/". */
  prompt: string
  mode: 'shell' | 'field' | 'attach' | 'confirm' | 'sending' | 'done'
  /** Cuando hay tope de caracteres, para el contador del cliente. */
  max?: number
  /** El cliente limpia la pantalla. */
  clear?: boolean
}

type Session = {
  id: string
  createdAt: number
  /** Paso actual de la postulación, o null si todavía anda mirando archivos. */
  step: number | null
  draft: ApplicationFields
  cv: { bytes: Uint8Array; name: string } | null
  flag: boolean
  sending: boolean
  done: boolean
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const MAX_SESSIONS = 2000
/** Nadie llena esto de verdad en menos de un minuto. */
const MIN_FILL_MS = 60_000

/** El sitio es abierto: si algo se rompe, que puedan venir a mirarlo. */
const REPO = 'https://github.com/BipBop-Labs/bipbop.cl'

/** Envíos en curso, para que un doble Enter no mande dos veces. */
const sending = new Set<string>()

type Row = {
  id: string
  created_at: number
  state: string
  cv: Uint8Array | null
  cv_name: string | null
}

function sweep() {
  const db = getDb()
  db.prepare('DELETE FROM sessions WHERE created_at < ?').run(
    Date.now() - SESSION_TTL_MS,
  )
  // Tope duro por si alguien abre sesiones en masa: se van las más viejas.
  db.prepare(
    `DELETE FROM sessions WHERE id IN (
       SELECT id FROM sessions ORDER BY updated_at DESC LIMIT -1 OFFSET ?
     )`,
  ).run(MAX_SESSIONS)
}

function saveSession(session: Session) {
  getDb()
    .prepare(
      `INSERT INTO sessions (id, created_at, updated_at, state, cv, cv_name)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         updated_at = excluded.updated_at,
         state      = excluded.state,
         cv         = excluded.cv,
         cv_name    = excluded.cv_name`,
    )
    .run(
      session.id,
      session.createdAt,
      Date.now(),
      JSON.stringify({
        step: session.step,
        draft: session.draft,
        flag: session.flag,
        done: session.done,
      }),
      session.cv?.bytes ?? null,
      session.cv?.name ?? null,
    )
}

function getSession(id?: string): { session: Session; expired: boolean } {
  sweep()

  const row = id
    ? (getDb()
        .prepare('SELECT * FROM sessions WHERE id = ?')
        .get(id) as Row | undefined)
    : undefined

  if (row) {
    const state = JSON.parse(row.state) as Pick<
      Session,
      'step' | 'draft' | 'flag' | 'done'
    >
    return {
      session: {
        id: row.id,
        createdAt: row.created_at,
        ...state,
        cv: row.cv ? { bytes: row.cv, name: row.cv_name ?? 'cv.pdf' } : null,
        sending: sending.has(row.id),
      },
      expired: false,
    }
  }

  const session: Session = {
    id: randomUUID(),
    createdAt: Date.now(),
    step: null,
    draft: { ...EMPTY_FIELDS },
    cv: null,
    flag: false,
    sending: false,
    done: false,
  }
  saveSession(session)
  // Si traía un id que ya no está, lo que había se perdió y hay que decirlo.
  return { session, expired: Boolean(id) }
}

export type Pending = {
  id: string
  startedAt: string
  lastSeenAt: string
  step: number
  steps: number
  fullName: string
  email: string
  hasCv: boolean
  written: number
}

/** Postulaciones a medio terminar, para poder rescatarlas desde /admin. */
export function listPendingSessions(): Array<Pending> {
  const rows = getDb()
    .prepare(
      `SELECT id, created_at, updated_at, state, cv_name
       FROM sessions ORDER BY updated_at DESC`,
    )
    .all() as Array<{
    id: string
    created_at: number
    updated_at: number
    state: string
    cv_name: string | null
  }>

  return rows
    .map((row) => ({ row, state: JSON.parse(row.state) as Session }))
    .filter(({ state }) => state.step !== null && !state.done)
    .map(({ row, state }) => ({
      id: row.id,
      startedAt: new Date(row.created_at).toISOString(),
      lastSeenAt: new Date(row.updated_at).toISOString(),
      step: Math.min((state.step as number) + 1, STEPS.length),
      steps: STEPS.length,
      fullName: state.draft.fullName,
      email: state.draft.email,
      hasCv: Boolean(row.cv_name),
      written:
        state.draft.answerProject.length +
        state.draft.answerSimplicity.length +
        state.draft.answerAi.length,
    }))
}

export function resetSessions() {
  sending.clear()
  getDb().exec('DELETE FROM sessions')
}

type Step = {
  name: FieldName
  /** Lo que se imprime antes de pedir el dato. */
  ask: Array<string>
  prompt: string
  kind: 'line' | 'text' | 'file' | 'project'
  prefix?: string
}

const STEPS: Array<Step> = [
  {
    name: 'fullName',
    ask: ['1/8  ¿Cómo te llamas?'],
    prompt: '>',
    kind: 'line',
  },
  {
    name: 'email',
    ask: ['2/8  ¿A qué correo te escribimos?'],
    prompt: '>',
    kind: 'line',
  },
  {
    name: 'github',
    ask: ['3/8  Tu GitHub. Solo el usuario.'],
    prompt: GITHUB_PREFIX,
    kind: 'line',
    prefix: GITHUB_PREFIX,
  },
  {
    name: 'linkedin',
    ask: ['4/8  Tu LinkedIn. Solo el perfil.'],
    prompt: LINKEDIN_PREFIX,
    kind: 'line',
    prefix: LINKEDIN_PREFIX,
  },
  {
    name: 'cv',
    ask: [
      '5/8  Tu CV en PDF, máximo 10 MB.',
      '     Presiona Enter para elegir el archivo.',
      '     Si estás en computador, también puedes arrastrarlo aquí.',
    ],
    prompt: '(Enter)',
    kind: 'file',
  },
  {
    name: 'answerProject',
    ask: [
      '6/8  Algo que hayas construido',
      '',
      '     Pega el enlace (repositorio, demo o producto) y cuéntanos:',
      '     ¿qué problema resolvía, qué hiciste tú personalmente, qué',
      '     resultado tuvo y qué cambiaste después de verlo en uso?',
    ],
    prompt: '>',
    kind: 'project',
  },
  {
    name: 'answerSimplicity',
    ask: [
      '7/8  Ownership y simplificación',
      '',
      '     Cuéntanos sobre una ocasión reciente en que tuviste que hacerte',
      '     cargo de un problema importante pero poco definido. ¿Cómo',
      '     decidiste qué construir primero, qué dejaste fuera y qué',
      '     lograste poner en producción?',
    ],
    prompt: '>',
    kind: 'text',
  },
  {
    name: 'answerAi',
    ask: [
      '8/8  Trabajo con IA',
      '',
      '     Cuéntanos un caso concreto en el que incorporaste IA durante un',
      '     desarrollo. ¿En qué partes del proceso la usaste, qué decisiones',
      '     tomaste tú, qué sugerencia rechazaste y cómo verificaste el',
      '     resultado?',
    ],
    prompt: '>',
    kind: 'text',
  },
]

/** Se sale como en vim. */
function isQuit(input: string): boolean {
  return [':q', ':q!', ':quit', ':wq'].includes(input.trim())
}

const out = (...text: Array<string>): Array<Line> =>
  text.map((t) => ({ kind: 'out' as const, text: t }))
const err = (...text: Array<string>): Array<Line> =>
  text.map((t) => ({ kind: 'err' as const, text: t }))
const muted = (...text: Array<string>): Array<Line> =>
  text.map((t) => ({ kind: 'muted' as const, text: t }))
const head = (...text: Array<string>): Array<Line> =>
  text.map((t) => ({ kind: 'head' as const, text: t }))

function block(text: string): Array<Line> {
  return out(...text.split('\n'))
}

/** La sesión vivía en memoria del servidor y ya no está. */
function expiredNotice(): Array<Line> {
  return err(
    'La sesión expiró y se perdió lo que llevabas.',
    'Corre ./postular para empezar de nuevo.',
  )
}

/** El estado en que queda la terminal después de procesar algo. */
function state(session: Session, lines: Array<Line>): ShellReply {
  const base = { sessionId: session.id, version: VERSION, lines }

  if (session.done) return { ...base, prompt: '', mode: 'done' }
  if (session.step === null) return { ...base, prompt: '$', mode: 'shell' }
  if (session.step >= STEPS.length) {
    return { ...base, prompt: '(Enter)', mode: 'confirm' }
  }
  const step = STEPS[session.step]
  return {
    ...base,
    prompt: step.prompt,
    mode: step.kind === 'file' ? 'attach' : 'field',
    max:
      step.kind === 'text' || step.kind === 'project'
        ? MAX_ANSWER_LENGTH
        : undefined,
  }
}

/** Imprime la pregunta del paso actual. */
function askCurrent(session: Session): Array<Line> {
  if (session.step === null) return []
  if (session.step >= STEPS.length) return summary(session)
  return [{ kind: 'muted', text: '' }, ...out(...STEPS[session.step].ask)]
}

function summary(session: Session): Array<Line> {
  // Se muestra ya normalizado: lo mismo que va a viajar.
  const d = normalizeFields({
    ...session.draft,
    github: fromHandle(session.draft.github, GITHUB_PREFIX),
    linkedin: fromHandle(session.draft.linkedin, LINKEDIN_PREFIX),
  })
  return [
    { kind: 'muted', text: '' },
    ...out(
      'Listo. Esto es lo que vamos a enviar:',
      '',
      `  nombre     ${d.fullName}`,
      `  correo     ${d.email}`,
      `  github     ${d.github}`,
      `  linkedin   ${d.linkedin}`,
      `  proyecto   ${d.project}`,
      `  cv         ${session.cv?.name ?? ''} (${Math.ceil((session.cv?.bytes.byteLength ?? 0) / 1024)} KB)`,
      `  respuestas ${d.answerProject.length} + ${d.answerSimplicity.length} + ${d.answerAi.length} caracteres`,
      ...(session.flag ? ['  flag       ok'] : []),
      '',
    ),
    ...muted('Presiona Enter para enviar, o :q para salir.'),
  ]
}

/** Valida un campo suelto reusando el validador compartido. */
function fieldError(name: FieldName, draft: ApplicationFields) {
  const composed = normalizeFields({
    ...draft,
    github: fromHandle(draft.github, GITHUB_PREFIX),
    linkedin: fromHandle(draft.linkedin, LINKEDIN_PREFIX),
  })
  return validate(composed, { name: 'x.pdf', size: 1, type: 'application/pdf' })[
    name
  ]
}

function startApply(session: Session, flag: boolean): Array<Line> {
  session.step = 0
  session.draft = { ...EMPTY_FIELDS }
  session.cv = null
  if (flag) session.flag = true

  return [
    ...head('BipBop Labs, postulación.'),
    ...muted(
      'Una cosa a la vez. :q para salir.',
      ...(flag ? ['flag aceptada.'] : []),
    ),
    ...askCurrent(session),
  ]
}

function runCommand(session: Session, input: string): Array<Line> {
  const raw = input.trim()
  const [cmd, ...rest] = raw.split(/\s+/)
  const arg = rest.join(' ')

  if (!raw) return []

  switch (cmd) {
    case 'help':
    case '?':
      return block(HELP)

    case 'ls': {
      const all = rest.includes('-a') || rest.includes('-la')
      const names = Object.keys(FILES).filter((n) => all || !n.startsWith('.'))
      return [
        { kind: 'out' as const, text: names.join('   ') },
        { kind: 'file' as const, text: 'postular*' },
      ]
    }

    case 'cat': {
      if (!arg) return err('cat: falta el archivo')
      const file = FILES[arg] ?? FILES[arg.replace(/^\.\//, '')]
      if (!file) return err(`cat: ${arg}: no existe`)
      return block(file)
    }

    case 'clear':
      return []

    case './postular':
    case 'postular':
    case './postular.sh': {
      if (rest.includes('--help') || rest.includes('-h'))
        return block(POSTULAR_HELP)

      const at = rest.indexOf('--flag')
      const given = at !== -1 ? rest[at + 1] : undefined
      if (at !== -1 && given !== FLAG_VALUE) {
        return err('esa flag no es.')
      }
      return startApply(session, at !== -1)
    }

    case 'agents':
    case 'agentes':
      return block(AGENTS)

    case 'whoami':
      return out('invitado')

    default:
      return err(`${cmd}: no existe. Prueba "help".`)
  }
}

/** Pasa al siguiente dato, saltando el CV si ya lo tenemos. */
function advance(session: Session): Array<Line> {
  session.step = (session.step as number) + 1
  while (
    session.step < STEPS.length &&
    STEPS[session.step].kind === 'file' &&
    session.cv
  ) {
    session.step += 1
  }
  return askCurrent(session)
}

/** El primer enlace que aparece en el texto. */
const URL_IN_TEXT =
  /(https?:\/\/\S+|(?:[\w-]+\.)+(?:com|cl|dev|io|app|net|org|ai|co|me|sh|xyz)(?:\/\S*)?)/i

function applyInput(session: Session, input: string): Array<Line> {
  const step = STEPS[session.step as number]

  if (isQuit(input)) {
    session.step = null
    session.draft = { ...EMPTY_FIELDS }
    session.cv = null
    return muted('Saliste de la postulación. Nada se envió.')
  }

  if (step.kind === 'file') {
    // Enter vacío abre el selector de archivos en el cliente.
    return muted('Presiona Enter para elegir el PDF.')
  }

  const value = step.kind === 'line' ? input.trim() : input
  const draft = { ...session.draft, [step.name]: value }

  // La pregunta del proyecto trae el enlace adentro: lo sacamos de ahí.
  if (step.kind === 'project') {
    const found = value.match(URL_IN_TEXT)?.[0]
    if (!found) {
      return err('Falta el enlace al proyecto. Pégalo junto con tu respuesta.')
    }
    draft.project = found
    const badLink = fieldError('project', draft)
    if (badLink) return err(badLink)
  }

  const problem = fieldError(step.name, draft)
  if (problem) return err(problem)

  session.draft = draft
  return advance(session)
}

function attachCv(
  session: Session,
  file: { bytes: Uint8Array; name: string; type: string },
): Array<Line> {
  if (session.step === null) {
    return err('Todavía no estás postulando. Corre ./postular primero.')
  }

  const meta = { name: file.name, size: file.bytes.byteLength, type: file.type }
  const problem = validateCv(meta) ?? inspectPdf(file.bytes)
  if (problem) return err(problem)

  const onCvStep = STEPS[session.step]?.kind === 'file'
  session.cv = { bytes: file.bytes, name: file.name }

  const recibido = out(
    `adjuntado: ${file.name} (${Math.ceil(file.bytes.byteLength / 1024)} KB)`,
  )

  // Si lo soltaron antes de que le tocara, lo guardamos y seguimos donde iban.
  if (!onCvStep) return recibido

  return [...recibido, ...advance(session)]
}

async function send(session: Session, ip: string): Promise<Array<Line>> {
  if (sending.has(session.id)) return []
  if (isRateLimited(ip, 'apply')) {
    return err('Demasiadas postulaciones desde aquí. Inténtalo más tarde.')
  }
  if (Date.now() - session.createdAt < MIN_FILL_MS) {
    return err('Eso fue muy rápido. Tómate un momento y vuelve a intentar.')
  }

  const fields = normalizeFields({
    ...session.draft,
    github: fromHandle(session.draft.github, GITHUB_PREFIX),
    linkedin: fromHandle(session.draft.linkedin, LINKEDIN_PREFIX),
  })

  if (isDuplicate(fields.email)) {
    return err('Ya recibimos una postulación con ese correo.')
  }

  if (!session.cv) return err('Falta el CV. Adjunta el PDF antes de enviar.')

  sending.add(session.id)
  try {
    const record = await submitApplication(fields, session.cv, {
      source: 'terminal',
      flag: session.flag,
    })
    // Se cobra recién ahora: los intentos fallidos no gastan cuota.
    recordHit(ip, 'apply')
    session.done = true
    session.cv = null // el PDF ya viajó, no lo dejamos guardado
    return [
      { kind: 'muted', text: '' },
      { kind: 'ok', text: 'Postulación recibida' },
      { kind: 'muted', text: '' },
      ...out(
        'Gracias por postular a BipBop Labs. Revisaremos tu experiencia y',
        'los proyectos que compartiste. Si tu perfil calza con lo que',
        'estamos buscando, nos pondremos en contacto contigo.',
      ),
      { kind: 'muted', text: '' },
      ...muted(`ref ${record.id}`),
    ]
  } catch (error) {
    if (error instanceof CvRejected) return err(error.message)

    const motivo = error instanceof Error ? error.message : String(error)
    console.error(`[shell] no se pudo guardar (${session.id}): ${motivo}`)
    return [
      ...err(
        'Se rompió algo de nuestro lado, no tuyo.',
        'Tus respuestas siguen acá: presiona Enter para reintentar.',
      ),
      ...muted(
        '',
        `motivo: ${motivo}`,
        `ref: ${session.id}`,
        'Si se repite, cuéntanos qué pasó y lo arreglamos:',
        `${REPO}/issues/new`,
      ),
    ]
  } finally {
    sending.delete(session.id)
  }
}

/** Punto de entrada: una línea escrita en la terminal. */
export async function runShell(
  sessionId: string | undefined,
  input: string,
  ip: string,
): Promise<ShellReply> {
  const { session, expired } = getSession(sessionId)

  if (session.done) return state(session, [])

  // El eco repite el prompt que estaba activo, como una terminal de verdad.
  const echo: Array<Line> = [
    { kind: 'in', text: input, prompt: state(session, []).prompt },
  ]

  if (expired) return state(session, [...echo, ...expiredNotice()])

  const reply = (lines: Array<Line>) => {
    saveSession(session)
    return state(session, lines)
  }

  // Todavía no empieza a postular: es un comando.
  if (session.step === null) {
    const lines = runCommand(session, input)
    const out = reply([...echo, ...lines])
    if (input.trim() === 'clear') return { ...out, lines: [], clear: true }
    return out
  }

  // Terminó de responder y confirma con Enter.
  if (session.step >= STEPS.length) {
    if (isQuit(input)) {
      session.step = null
      session.draft = { ...EMPTY_FIELDS }
      session.cv = null
      return reply([...echo, ...muted('Saliste. Nada se envió.')])
    }
    if (input.trim()) {
      return reply([...echo, ...muted('Presiona Enter para enviar.')])
    }
    return reply([...echo, ...(await send(session, ip))])
  }

  return reply([...echo, ...applyInput(session, input)])
}

const COMMANDS = ['help', 'ls', 'cat', 'clear', './postular', 'agents']

/** El prefijo más largo que comparten todos los candidatos. */
function commonPrefix(items: Array<string>): string {
  if (!items.length) return ''
  let prefix = items[0]
  for (const item of items) {
    while (!item.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  return prefix
}

/**
 * Tab. Completa comandos y nombres de archivo. Los ocultos solo aparecen si
 * ya escribiste el punto, igual que en un shell de verdad.
 */
export function completeInput(
  sessionId: string | undefined,
  input: string,
): ShellReply & { completion?: string } {
  const { session } = getSession(sessionId)
  const base = state(session, [])

  // Solo se completa en el shell, no mientras se responde.
  if (session.step !== null || session.done) return base

  const parts = input.split(/\s+/)
  const editing = parts[parts.length - 1]
  const isFirst = parts.length === 1

  const pool = isFirst
    ? COMMANDS
    : parts[0] === 'cat'
      ? Object.keys(FILES).filter(
          (name) => editing.startsWith('.') || !name.startsWith('.'),
        )
      : []

  const matches = pool.filter((name) => name.startsWith(editing))
  if (!matches.length) return base

  const completed = commonPrefix(matches)
  const rest = parts.slice(0, -1)
  const done = matches.length === 1
  const completion = [...rest, done ? `${completed} ` : completed].join(' ')

  return {
    ...base,
    completion,
    // Como bash: si hay varias opciones, las lista.
    lines: matches.length > 1 ? out(matches.join('   ')) : [],
  }
}

/** Punto de entrada del archivo adjunto. */
export function runAttach(
  sessionId: string | undefined,
  file: { bytes: Uint8Array; name: string; type: string },
): ShellReply {
  const { session, expired } = getSession(sessionId)
  if (expired) {
    return state(session, expiredNotice())
  }
  if (session.done) return state(session, [])

  const lines = attachCv(session, file)
  saveSession(session)
  return state(session, lines)
}

/** Primera carga de la página. */
export function greet(sessionId?: string): ShellReply {
  const { session } = getSession(sessionId)
  if (session.step === null || session.done) return state(session, [])

  // Recargó la página con una postulación a medias: la retomamos.
  return state(session, [
    ...muted('Retomando tu postulación donde la dejaste.'),
    ...askCurrent(session),
  ])
}
