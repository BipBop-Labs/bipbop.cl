import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import {
  EMPTY_FIELDS,
  FIELD_ORDER,
  GITHUB_PREFIX,
  LINKEDIN_PREFIX,
  MAX_ANSWER_LENGTH,
  firstInvalidField,
  fromHandle,
  hasErrors,
  normalizeFields,
  toHandle,
  validate,
} from '#/lib/application'
import type { ApplicationFields, Errors, FieldName } from '#/lib/application'

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

/**
 * Los campos son una línea, no una caja: el foco los enciende en moss y el
 * error los pinta en clay. Mismo lenguaje de hairlines que el resto del sitio.
 */
const INPUT =
  'w-full border-0 border-b border-line bg-transparent px-0 py-2 text-[1.05rem] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-success aria-[invalid=true]:border-danger'
const TEXTAREA =
  'mt-4 w-full resize-y rounded-[2px] border border-line bg-surface px-4 py-3 text-base leading-[1.6] text-ink outline-none transition-colors focus:border-success aria-[invalid=true]:border-danger'
const LABEL =
  'block text-[0.62rem] tracking-[0.15em] text-ink-3 uppercase transition-colors'
const HINT = 'mt-2 text-[0.8rem] text-ink-3'
const ERROR = 'mt-2 text-[0.8rem] text-danger'
const RULE =
  'rule-after mt-16 mb-8 flex items-center gap-4 text-[0.85rem] font-medium text-ink-3'

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
    (cv !== null ||
      FIELD_ORDER.some(
        (f) => f !== 'cv' && fields[f as keyof ApplicationFields],
      ))

  // Avisa antes de salir si hay algo escrito y todavía no se envía.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = (name: keyof ApplicationFields) => (value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }))
    clearError(name)
  }

  const clearError = (name: FieldName) =>
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })

  const focusFirstInvalid = (found: Errors) => {
    const field = firstInvalidField(found)
    if (field) refs.current[field]?.focus()
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (status === 'submitting') return // sin envíos duplicados

    // Los perfiles se escriben como handle; aquí se vuelven URL completa.
    const handles = {
      github: toHandle(fields.github, GITHUB_PREFIX),
      linkedin: toHandle(fields.linkedin, LINKEDIN_PREFIX),
    }
    const normalized = normalizeFields({
      ...fields,
      github: fromHandle(fields.github, GITHUB_PREFIX),
      linkedin: fromHandle(fields.linkedin, LINKEDIN_PREFIX),
    })
    setFields({ ...normalized, ...handles })

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
    for (const [key, value] of Object.entries(normalized))
      body.append(key, value)
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
    <main className="mx-auto max-w-[820px] px-6 pt-16 pb-24 leading-[1.65] max-[720px]:pt-10">
      <Crumb />

      <header className="motion-safe-opacity animate-rise opacity-0">
        <p className="mb-4 text-[0.62rem] tracking-[0.15em] text-success uppercase">
          Estamos contratando · Santiago, Chile
        </p>
        <h1 className="max-w-[18ch] text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.08] font-semibold tracking-[-0.02em]">
          Software Engineer{' '}
          <em className="text-success not-italic">en BipBop Labs</em>
        </h1>
      </header>

      <div className="mt-10 grid gap-x-12 gap-y-6 max-[720px]:grid-cols-1 min-[721px]:grid-cols-[1fr_auto]">
        <div className="motion-safe-opacity animate-rise opacity-0 [animation-delay:0.12s]">
          <p className="max-w-[58ch] text-[1.15rem] leading-[1.55] text-ink-2">
            Somos el equipo detrás de{' '}
            <Link
              className="border-b border-success text-success no-underline transition-opacity hover:opacity-70"
              to="/revi"
            >
              Revi
            </Link>
            , la plataforma de asistentes con IA para tramitar permisos
            impulsada por la Cámara Chilena de la Construcción.
          </p>
          <p className="mt-4 max-w-[58ch]">
            Hoy somos tres personas. Buscamos a alguien con experiencia, con
            ownership real de lo que construye, con capacidad de simplificar
            problemas y que use herramientas de IA a diario en su trabajo.
          </p>
        </div>

        <span
          aria-hidden="true"
          className="motion-safe-opacity block h-28 w-28 animate-rise self-start bg-[url('/brand/generated/stickers/01-logo.svg')] bg-contain bg-center bg-no-repeat opacity-0 [animation-delay:0.2s] max-[720px]:hidden"
        />
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="motion-safe-opacity animate-rise opacity-0 [animation-delay:0.28s]"
      >
        <div className={RULE}>
          <span>Tus datos</span>
        </div>

        <div className="grid gap-x-12 gap-y-8 min-[721px]:grid-cols-2">
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
            prefix={GITHUB_PREFIX}
            placeholder="tu-usuario"
            inputMode="url"
          />
          <Field
            name="linkedin"
            label="LinkedIn"
            value={fields.linkedin}
            error={errors.linkedin}
            onChange={set('linkedin')}
            refs={refs}
            prefix={LINKEDIN_PREFIX}
            placeholder="tu-perfil"
            inputMode="url"
          />
          <div className="min-[721px]:col-span-2">
            <Field
              name="project"
              label="Proyecto, producto, repositorio o demo"
              value={fields.project}
              error={errors.project}
              onChange={set('project')}
              refs={refs}
              placeholder="Algo que hayas construido y puedas mostrarnos"
              hint="Sobre esto te preguntamos más abajo."
              inputMode="url"
            />
          </div>
          <div className="min-[721px]:col-span-2">
            <CvField
              file={cv}
              error={errors.cv}
              refs={refs}
              onChange={(file) => {
                setCv(file)
                clearError('cv')
              }}
            />
          </div>
        </div>

        <div className={RULE}>
          <span>Tres preguntas</span>
        </div>

        <ol className="grid gap-14">
          {QUESTIONS.map((q, index) => (
            <Answer
              key={q.name}
              index={index + 1}
              name={q.name}
              title={q.title}
              label={q.label}
              value={fields[q.name as keyof ApplicationFields]}
              error={errors[q.name]}
              onChange={set(q.name as keyof ApplicationFields)}
              refs={refs}
            />
          ))}
        </ol>

        {/* Honeypot: oculto para personas, visible para bots. */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
          <label htmlFor="website">No llenar</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div
          className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-8"
          aria-live="polite"
        >
          <button
            type="submit"
            disabled={submitting}
            className="group inline-flex cursor-pointer items-center gap-3 rounded-[2px] border border-success bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-6 py-[0.85rem] text-[0.95rem] font-bold text-success transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--color-success)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? 'Enviando…' : 'Enviar postulación'}
            <span
              aria-hidden="true"
              className={
                submitting
                  ? 'h-[1em] w-[1em] rounded-full border border-success border-t-transparent motion-safe:animate-spin'
                  : 'transition-transform duration-200 group-hover:translate-x-1'
              }
            >
              {submitting ? '' : '→'}
            </span>
          </button>

          {status === 'error' && message ? (
            <p className="text-[0.9rem] text-danger" role="alert">
              {message}
            </p>
          ) : (
            <p className="text-[0.85rem] text-ink-3">
              Te responderemos por correo, escriba lo que escriba el resultado.
            </p>
          )}
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
  prefix,
  placeholder,
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
  prefix?: string
  placeholder?: string
  type?: string
  autoComplete?: string
  inputMode?: 'url' | 'text' | 'email'
}) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`

  const input = (
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      onChange={(e) => onChange(e.target.value)}
      ref={(el) => {
        refs.current[name] = el
      }}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : hint ? hintId : undefined}
      className={prefix ? `${INPUT} min-w-0 flex-1 border-b-0` : INPUT}
    />
  )

  return (
    <div className="group">
      <label
        className={`${LABEL} ${error ? 'text-danger' : 'group-focus-within:text-success'}`}
        htmlFor={name}
      >
        {label}
      </label>
      {prefix ? (
        // El dominio va impreso: se escribe solo el handle.
        <div
          className={`flex items-baseline border-b transition-colors group-focus-within:border-success ${
            error ? 'border-danger' : 'border-line'
          }`}
        >
          <span
            aria-hidden="true"
            className="py-2 text-[1.05rem] text-ink-3 select-none"
          >
            {prefix}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
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

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
}

/** El input nativo va oculto; la etiqueta es la superficie visible. */
function CvField({
  file,
  error,
  onChange,
  refs,
}: {
  file: File | null
  error?: string
  onChange: (file: File | null) => void
  refs: React.RefObject<Partial<Record<FieldName, HTMLElement | null>>>
}) {
  return (
    <div className="group">
      <span className={`${LABEL} ${error ? 'text-danger' : ''}`}>
        CV en PDF
      </span>
      <label
        htmlFor="cv"
        className={`mt-2 flex cursor-pointer flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dashed py-3 transition-colors group-focus-within:border-success hover:border-ink-3 ${
          error ? 'border-danger' : file ? 'border-success' : 'border-line'
        }`}
      >
        <span className={file ? 'text-[1.05rem] text-ink' : 'text-[1.05rem] text-ink-3'}>
          {file ? file.name : 'Adjuntar archivo…'}
        </span>
        <span className="text-[0.8rem] text-ink-3">
          {file ? `${formatSize(file.size)} · cambiar` : 'PDF · máximo 10 MB'}
        </span>
      </label>
      <input
        id="cv"
        name="cv"
        type="file"
        accept="application/pdf,.pdf"
        ref={(el) => {
          refs.current.cv = el
        }}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'cv-error' : undefined}
        className="sr-only"
      />
      {error ? (
        <p className={ERROR} id="cv-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function Answer({
  index,
  name,
  title,
  label,
  value,
  error,
  onChange,
  refs,
}: {
  index: number
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
  const filled = Math.min(value.length / MAX_ANSWER_LENGTH, 1)

  return (
    <li className="group grid gap-x-6 gap-y-3 min-[721px]:grid-cols-[3.5rem_1fr]">
      <span
        aria-hidden="true"
        className="text-[1.6rem] leading-none font-semibold tabular-nums text-line transition-colors group-focus-within:text-success max-[720px]:text-[1.2rem]"
      >
        {String(index).padStart(2, '0')}
      </span>

      <div>
        <p
          className={`${LABEL} mb-2 ${error ? 'text-danger' : 'group-focus-within:text-success'}`}
        >
          {title}
        </p>
        <label
          className="block max-w-[58ch] text-[1.05rem] leading-[1.5] text-ink"
          htmlFor={name}
        >
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
          className={TEXTAREA}
        />

        {/* El avance del contador, como hairline: se lee de reojo. */}
        <div className="mt-2 h-px w-full bg-line" aria-hidden="true">
          <div
            className={`h-px origin-left transition-transform duration-300 ${over ? 'bg-danger' : 'bg-success'}`}
            style={{ transform: `scaleX(${filled})` }}
          />
        </div>

        <div className="mt-2 flex justify-between gap-4">
          {error ? (
            <p className={`${ERROR} mt-0`} id={errorId}>
              {error}
            </p>
          ) : (
            <span />
          )}
          <p
            className={`text-[0.8rem] tabular-nums ${over ? 'text-danger' : 'text-ink-3'}`}
            id={countId}
          >
            {value.length} / {MAX_ANSWER_LENGTH}
          </p>
        </div>
      </div>
    </li>
  )
}

function Success() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[820px] flex-col justify-center px-6 py-24 leading-[1.65]">
      <span
        aria-hidden="true"
        className="motion-safe-opacity mb-8 block h-24 w-24 animate-rise bg-[url('/brand/generated/stickers/01-logo.svg')] bg-contain bg-center bg-no-repeat opacity-0"
      />
      <h1
        className="motion-safe-opacity mb-6 max-w-[16ch] animate-rise text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.08] font-semibold tracking-[-0.02em] opacity-0 [animation-delay:0.1s] focus:outline-none"
        tabIndex={-1}
        ref={(el) => el?.focus()}
      >
        Postulación <em className="text-success not-italic">recibida</em>
      </h1>
      <p className="motion-safe-opacity max-w-[58ch] animate-rise text-[1.15rem] leading-[1.55] text-ink-2 opacity-0 [animation-delay:0.18s]">
        Gracias por postular a BipBop Labs. Revisaremos tu experiencia y los
        proyectos que compartiste. Si tu perfil calza con lo que estamos
        buscando, nos pondremos en contacto contigo.
      </p>
      <Link
        className="motion-safe-opacity mt-10 inline-flex w-fit animate-rise items-center gap-2 border-b border-line text-[0.9rem] text-ink-2 no-underline opacity-0 transition-colors [animation-delay:0.26s] hover:border-success hover:text-success"
        to="/"
      >
        Volver a bipbop.cl
      </Link>
    </main>
  )
}

function Crumb() {
  return (
    <nav
      className="mb-10 text-[0.78rem] tracking-[0.08em] text-ink-3 uppercase"
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
    <footer className="mt-20 border-t border-line pt-8 text-[0.78rem] tracking-[0.06em] text-ink-3">
      <p>
        © {new Date().getFullYear()} BipBop Labs · Santiago, CL ·{' '}
        <Link className="border-0 text-ink-2 no-underline" to="/">
          bipbop.cl
        </Link>
      </p>
    </footer>
  )
}
