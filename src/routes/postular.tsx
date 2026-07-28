import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import {
  EMPTY_FIELDS,
  FIELD_ORDER,
  MAX_ANSWER_LENGTH,
  firstInvalidField,
  hasErrors,
  normalizeFields,
  validate,
} from '#/lib/application'
import type {
  ApplicationFields,
  Errors,
  FieldName,
} from '#/lib/application'

export const Route = createFileRoute('/postular')({
  head: () => ({
    meta: [
      { title: 'Postula a BipBop Labs · Software Engineer' },
      {
        name: 'description',
        content:
          'Buscamos un Software Engineer con experiencia, ownership y uso habitual de IA en su flujo de trabajo. Postula a BipBop Labs, el equipo detrás de Revi.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Postula a BipBop Labs' },
      { property: 'og:url', content: 'https://bipbop.cl/postular' },
    ],
    links: [{ rel: 'canonical', href: 'https://bipbop.cl/postular' }],
  }),
  component: Postular,
})

const INPUT =
  'w-full rounded-[2px] border border-line bg-surface px-3 py-[0.6rem] text-base text-ink outline-none transition-colors focus:border-success focus:ring-1 focus:ring-success aria-[invalid=true]:border-danger'
const LABEL = 'block text-[0.9rem] font-medium text-ink'
const HINT = 'mt-1 text-[0.8rem] text-ink-3'
const ERROR = 'mt-1 text-[0.8rem] text-danger'
const H2 = 'mt-12 mb-4 text-[1.35rem] font-semibold tracking-[-0.01em]'

const QUESTIONS: Array<{ name: FieldName; title: string; label: string }> = [
  {
    name: 'answerProject',
    title: 'Lo que construiste',
    label:
      'Elige uno de los proyectos que compartiste. ¿Qué problema resolvía, qué hiciste tú personalmente, qué resultado tuvo y qué cambiaste después de verlo en uso?',
  },
  {
    name: 'answerSimplicity',
    title: 'Ownership y simplificación',
    label:
      'Cuéntanos sobre una ocasión reciente en que tuviste que hacerte cargo de un problema importante pero poco definido. ¿Cómo decidiste qué construir primero, qué dejaste fuera y qué lograste poner en producción?',
  },
  {
    name: 'answerAi',
    title: 'Trabajo con IA',
    label:
      'Cuéntanos un caso concreto en el que incorporaste IA durante un desarrollo. ¿En qué partes del proceso la usaste, qué decisiones tomaste tú, qué sugerencia rechazaste y cómo verificaste el resultado?',
  },
]

type Status = 'idle' | 'submitting' | 'error' | 'success'

function Postular() {
  const [fields, setFields] = useState<ApplicationFields>(EMPTY_FIELDS)
  const [cv, setCv] = useState<File | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const startedAt = useRef(Date.now())
  const refs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({})

  const dirty =
    status !== 'success' &&
    (cv !== null || FIELD_ORDER.some((f) => f !== 'cv' && fields[f as keyof ApplicationFields]))

  // Avisa antes de salir si hay algo escrito y todavía no se envía.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = (name: keyof ApplicationFields) => (value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const focusFirstInvalid = (found: Errors) => {
    const field = firstInvalidField(found)
    if (field) refs.current[field]?.focus()
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (status === 'submitting') return // sin envíos duplicados

    const normalized = normalizeFields(fields)
    setFields(normalized)

    const found = validate(
      normalized,
      cv ? { name: cv.name, size: cv.size, type: cv.type } : null,
    )
    if (hasErrors(found)) {
      setErrors(found)
      setStatus('error')
      setMessage('Revisa los campos marcados.')
      focusFirstInvalid(found)
      return
    }

    setStatus('submitting')
    setErrors({})
    setMessage('')

    const body = new FormData()
    for (const [key, value] of Object.entries(normalized)) body.append(key, value)
    body.append('cv', cv as File)
    body.append('startedAt', String(startedAt.current))
    body.append('website', '') // honeypot

    try {
      const res = await fetch('/api/applications', { method: 'POST', body })
      const data = (await res.json()) as {
        ok: boolean
        errors?: Errors
        message?: string
      }

      if (res.ok && data.ok) {
        setStatus('success')
        return
      }

      setStatus('error')
      if (data.errors) {
        setErrors(data.errors)
        setMessage('Revisa los campos marcados.')
        focusFirstInvalid(data.errors)
      } else {
        setMessage(data.message ?? 'No pudimos enviar tu postulación.')
      }
    } catch {
      setStatus('error')
      setMessage(
        'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      )
    }
  }

  if (status === 'success') return <Success />

  const submitting = status === 'submitting'

  return (
    <main className="mx-auto max-w-[760px] px-6 pt-16 pb-24 leading-[1.65]">
      <Crumb />

      <h1 className="mb-5 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.1] font-normal tracking-[-0.01em]">
        Software Engineer <em className="text-success italic">en BipBop Labs</em>
      </h1>

      <p className="mb-4 max-w-[60ch] text-[1.2rem] leading-[1.55] font-normal text-ink-2">
        Somos el equipo detrás de{' '}
        <Link
          className="border-b border-success text-success no-underline hover:opacity-70"
          to="/revi"
        >
          Revi
        </Link>
        , la plataforma de asistentes con IA para tramitar permisos impulsada
        por la Cámara Chilena de la Construcción.
      </p>
      <p className="mb-10 max-w-[62ch]">
        Hoy somos tres personas. Buscamos a alguien con experiencia, con
        ownership real de lo que construye, con capacidad de simplificar
        problemas y que use herramientas de IA a diario en su trabajo.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <h2 className={H2}>Tus datos</h2>

        <div className="grid gap-5">
          <Field
            name="fullName"
            label="Nombre completo"
            value={fields.fullName}
            error={errors.fullName}
            onChange={set('fullName')}
            refs={refs}
            autoComplete="name"
          />
          <Field
            name="email"
            label="Correo electrónico"
            type="email"
            value={fields.email}
            error={errors.email}
            onChange={set('email')}
            refs={refs}
            autoComplete="email"
          />
          <Field
            name="github"
            label="GitHub"
            value={fields.github}
            error={errors.github}
            onChange={set('github')}
            refs={refs}
            hint="github.com/tu-usuario"
            inputMode="url"
          />
          <Field
            name="linkedin"
            label="LinkedIn"
            value={fields.linkedin}
            error={errors.linkedin}
            onChange={set('linkedin')}
            refs={refs}
            hint="linkedin.com/in/tu-perfil"
            inputMode="url"
          />
          <Field
            name="project"
            label="Enlace a un proyecto, producto, repositorio o demo"
            value={fields.project}
            error={errors.project}
            onChange={set('project')}
            refs={refs}
            hint="Algo que hayas construido y puedas mostrarnos."
            inputMode="url"
          />

          <div>
            <label className={LABEL} htmlFor="cv">
              CV en PDF
            </label>
            <input
              id="cv"
              name="cv"
              type="file"
              accept="application/pdf,.pdf"
              ref={(el) => {
                refs.current.cv = el
              }}
              onChange={(e) => {
                setCv(e.target.files?.[0] ?? null)
                setErrors((prev) => {
                  if (!prev.cv) return prev
                  const next = { ...prev }
                  delete next.cv
                  return next
                })
              }}
              aria-invalid={Boolean(errors.cv)}
              aria-describedby={errors.cv ? 'cv-error' : 'cv-hint'}
              className="mt-1 w-full cursor-pointer rounded-[2px] border border-line bg-surface px-3 py-[0.6rem] text-[0.9rem] text-ink-2 file:mr-3 file:cursor-pointer file:rounded-[2px] file:border file:border-line file:bg-page file:px-3 file:py-1 file:text-[0.85rem] file:text-ink aria-[invalid=true]:border-danger"
            />
            {errors.cv ? (
              <p className={ERROR} id="cv-error">
                {errors.cv}
              </p>
            ) : (
              <p className={HINT} id="cv-hint">
                Máximo 10 MB.
              </p>
            )}
          </div>
        </div>

        <h2 className={H2}>Tres preguntas</h2>

        <div className="grid gap-8">
          {QUESTIONS.map((q) => (
            <Answer
              key={q.name}
              name={q.name}
              title={q.title}
              label={q.label}
              value={fields[q.name as keyof ApplicationFields]}
              error={errors[q.name]}
              onChange={set(q.name as keyof ApplicationFields)}
              refs={refs}
            />
          ))}
        </div>

        {/* Honeypot: oculto para personas, visible para bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">No llenar</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4" aria-live="polite">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex cursor-pointer items-center gap-[0.55rem] rounded-[2px] border border-success bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-[1.05rem] py-[0.7rem] text-[0.95rem] font-bold text-success transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Enviando…' : 'Enviar postulación'}
          </button>
          {status === 'error' && message ? (
            <p className="text-[0.9rem] text-danger" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </form>

      <SiteFooter />
    </main>
  )
}

function Field({
  name,
  label,
  value,
  error,
  onChange,
  refs,
  hint,
  type = 'text',
  autoComplete,
  inputMode,
}: {
  name: FieldName
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  refs: React.RefObject<Partial<Record<FieldName, HTMLElement | null>>>
  hint?: string
  type?: string
  autoComplete?: string
  inputMode?: 'url' | 'text' | 'email'
}) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`

  return (
    <div>
      <label className={LABEL} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        ref={(el) => {
          refs.current[name] = el
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`${INPUT} mt-1`}
      />
      {error ? (
        <p className={ERROR} id={errorId}>
          {error}
        </p>
      ) : hint ? (
        <p className={HINT} id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function Answer({
  name,
  title,
  label,
  value,
  error,
  onChange,
  refs,
}: {
  name: FieldName
  title: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  refs: React.RefObject<Partial<Record<FieldName, HTMLElement | null>>>
}) {
  const errorId = `${name}-error`
  const countId = `${name}-count`
  const over = value.length > MAX_ANSWER_LENGTH

  return (
    <div>
      <p className="mb-1 text-[0.62rem] tracking-[0.15em] text-ink-3 uppercase">
        {title}
      </p>
      <label className={`${LABEL} max-w-[62ch] leading-[1.5]`} htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        ref={(el) => {
          refs.current[name] = el
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${errorId} ${countId}` : countId}
        className={`${INPUT} mt-2 resize-y`}
      />
      <div className="mt-1 flex justify-between gap-4">
        {error ? (
          <p className={ERROR} id={errorId}>
            {error}
          </p>
        ) : (
          <span />
        )}
        <p
          className={`text-[0.8rem] ${over ? 'text-danger' : 'text-ink-3'}`}
          id={countId}
        >
          {value.length} / {MAX_ANSWER_LENGTH}
        </p>
      </div>
    </div>
  )
}

function Success() {
  return (
    <main className="mx-auto max-w-[760px] px-6 pt-16 pb-24 leading-[1.65]">
      <Crumb />
      <span
        aria-hidden="true"
        className="mb-6 block h-20 w-20 bg-[url('/brand/generated/bipbop_logo.webp')] bg-contain bg-center bg-no-repeat"
      />
      <h1
        className="mb-5 font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.1] font-normal tracking-[-0.01em]"
        tabIndex={-1}
        ref={(el) => el?.focus()}
      >
        Postulación <em className="text-success italic">recibida</em>
      </h1>
      <p className="max-w-[60ch] text-[1.2rem] leading-[1.55] text-ink-2">
        Gracias por postular a BipBop Labs. Revisaremos tu experiencia y los
        proyectos que compartiste. Si tu perfil calza con lo que estamos
        buscando, nos pondremos en contacto contigo.
      </p>
      <SiteFooter />
    </main>
  )
}

function Crumb() {
  return (
    <nav
      className="mb-8 text-[0.78rem] tracking-[0.08em] text-ink-3 uppercase"
      aria-label="Breadcrumb"
    >
      <Link
        className="border-b border-dotted border-ink-3 text-ink-3 no-underline hover:border-success hover:text-success"
        to="/"
      >
        BipBop Labs
      </Link>{' '}
      / Postular
    </nav>
  )
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line pt-8 text-[0.78rem] tracking-[0.06em] text-ink-3">
      <p>
        © {new Date().getFullYear()} BipBop Labs · Santiago, CL ·{' '}
        <Link className="border-0 text-ink-2 no-underline" to="/">
          bipbop.cl
        </Link>
      </p>
    </footer>
  )
}
