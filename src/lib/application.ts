/**
 * Validación de la postulación laboral, compartida por el formulario y el
 * handler del servidor: las mismas reglas corren en ambos lados.
 */

export const MAX_ANSWER_LENGTH = 1200
export const MAX_CV_BYTES = 10 * 1024 * 1024

export type ApplicationFields = {
  fullName: string
  email: string
  github: string
  linkedin: string
  project: string
  answerProject: string
  answerSimplicity: string
  answerAi: string
}

export type FieldName = keyof ApplicationFields | 'cv'

/** Orden de los campos en el formulario: define a cuál se lleva el foco. */
export const FIELD_ORDER: Array<FieldName> = [
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

export type Errors = Partial<Record<FieldName, string>>

export const EMPTY_FIELDS: ApplicationFields = {
  fullName: '',
  email: '',
  github: '',
  linkedin: '',
  project: '',
  answerProject: '',
  answerSimplicity: '',
  answerAi: '',
}

/** Antepone https:// cuando el usuario pega un enlace sin esquema. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed // otro esquema: se rechaza después
  return `https://${trimmed}`
}

function parseUrl(value: string): URL | null {
  try {
    const url = new URL(normalizeUrl(value))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.')) return null
    return url
  } catch {
    return null
  }
}

/** true si el host es el dominio pedido o un subdominio suyo (cl.linkedin.com). */
function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase()
  return host === domain || host.endsWith(`.${domain}`)
}

function requireProfileUrl(
  value: string,
  domain: string,
  label: string,
): string | undefined {
  if (!value.trim()) return `Ingresa tu perfil de ${label}.`
  const url = parseUrl(value)
  if (!url) return `Ingresa una URL válida de ${domain}.`
  if (!hostMatches(url.hostname, domain))
    return `La URL debe ser de ${domain}.`
  if (url.pathname.replace(/\/+$/, '') === '')
    return `Incluye tu perfil, no solo ${domain}.`
  return undefined
}

function requireAnswer(value: string, label: string): string | undefined {
  if (!value.trim()) return `Responde ${label}.`
  if (value.length > MAX_ANSWER_LENGTH)
    return `Máximo ${MAX_ANSWER_LENGTH} caracteres.`
  return undefined
}

/** Metadatos del CV; en el cliente viene de un File, en el servidor de un Blob. */
export type CvMeta = { name: string; size: number; type: string } | null

export function validateCv(cv: CvMeta): string | undefined {
  if (!cv) return 'Adjunta tu CV en PDF.'
  const isPdf =
    cv.type === 'application/pdf' || cv.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'El CV debe ser un archivo PDF.'
  if (cv.size === 0) return 'El archivo está vacío.'
  if (cv.size > MAX_CV_BYTES) return 'El PDF no puede superar los 10 MB.'
  return undefined
}

export function validate(fields: ApplicationFields, cv: CvMeta): Errors {
  const errors: Errors = {}

  const name = fields.fullName.trim()
  if (!name) errors.fullName = 'Ingresa tu nombre completo.'
  else if (name.length < 2) errors.fullName = 'Ingresa tu nombre completo.'
  else if (name.length > 120) errors.fullName = 'Máximo 120 caracteres.'

  const email = fields.email.trim()
  if (!email) errors.email = 'Ingresa tu correo electrónico.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    errors.email = 'Ingresa un correo electrónico válido.'

  const github = requireProfileUrl(fields.github, 'github.com', 'GitHub')
  if (github) errors.github = github

  const linkedin = requireProfileUrl(
    fields.linkedin,
    'linkedin.com',
    'LinkedIn',
  )
  if (linkedin) errors.linkedin = linkedin

  if (!fields.project.trim())
    errors.project = 'Comparte un enlace a un proyecto, repo o demo.'
  else if (!parseUrl(fields.project))
    errors.project = 'Ingresa una URL válida.'

  const cvError = validateCv(cv)
  if (cvError) errors.cv = cvError

  const a1 = requireAnswer(fields.answerProject, 'sobre lo que construiste')
  if (a1) errors.answerProject = a1
  const a2 = requireAnswer(
    fields.answerSimplicity,
    'sobre ownership y simplificación',
  )
  if (a2) errors.answerSimplicity = a2
  const a3 = requireAnswer(fields.answerAi, 'sobre tu trabajo con IA')
  if (a3) errors.answerAi = a3

  return errors
}

/** Deja los campos listos para guardar: recorta y normaliza los enlaces. */
export function normalizeFields(fields: ApplicationFields): ApplicationFields {
  return {
    fullName: fields.fullName.trim(),
    email: fields.email.trim().toLowerCase(),
    github: normalizeUrl(fields.github),
    linkedin: normalizeUrl(fields.linkedin),
    project: normalizeUrl(fields.project),
    answerProject: fields.answerProject.trim(),
    answerSimplicity: fields.answerSimplicity.trim(),
    answerAi: fields.answerAi.trim(),
  }
}

export function firstInvalidField(errors: Errors): FieldName | undefined {
  return FIELD_ORDER.find((field) => errors[field])
}

export function hasErrors(errors: Errors): boolean {
  return Object.keys(errors).length > 0
}
