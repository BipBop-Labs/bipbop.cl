import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import {
  EMPTY_FIELDS,
  MAX_CV_BYTES,
  hasErrors,
  normalizeFields,
  validate,
} from '#/lib/application'
import type { ApplicationFields, Errors } from '#/lib/application'
import {
  CvRejected,
  isDuplicate,
  isRateLimited,
  recordHit,
  submitApplication,
} from '#/server/applications'
import { FLAG_VALUE } from '#/server/shell-files'

/**
 * The public route is closed. The legacy handler below remains exported only so
 * the existing admin and delivery behavior can still be regression-tested while
 * we finish the process with applications that were already received.
 */

function readFields(form: FormData): ApplicationFields {
  const fields = { ...EMPTY_FIELDS }
  for (const key of Object.keys(fields) as Array<keyof ApplicationFields>) {
    const value = form.get(key)
    fields[key] = typeof value === 'string' ? value : ''
  }
  return fields
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function handleApplication({
  request,
}: {
  request: Request
}): Promise<Response> {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json(
      { ok: false, message: 'No pudimos leer el formulario.' },
      { status: 400 },
    )
  }

  const ip = clientIp(request)
  if (isRateLimited(ip, 'apply')) {
    return json(
      { ok: false, message: 'Demasiados envíos.' },
      { status: 429 },
    )
  }

  const fields = normalizeFields(readFields(form))
  const cv = form.get('cv')
  const cvMeta =
    cv instanceof File ? { name: cv.name, size: cv.size, type: cv.type } : null

  const errors: Errors = validate(fields, cvMeta)
  if (hasErrors(errors)) {
    return json({ ok: false, errors }, { status: 400 })
  }

  const bytes = new Uint8Array(await (cv as File).arrayBuffer())
  if (bytes.byteLength > MAX_CV_BYTES) {
    return json(
      { ok: false, errors: { cv: 'El PDF no puede superar los 10 MB.' } },
      { status: 400 },
    )
  }

  if (isDuplicate(fields.email)) {
    return json(
      {
        ok: false,
        message: 'Ya recibimos una postulación con este correo.',
      },
      { status: 409 },
    )
  }

  try {
    const record = await submitApplication(
      fields,
      { bytes, name: (cv as File).name },
      {
        source: 'api',
        flag: String(form.get('flag') ?? '') === FLAG_VALUE,
      },
    )
    recordHit(ip, 'apply')
    return json({ ok: true, id: record.id })
  } catch (error) {
    if (error instanceof CvRejected) {
      return json(
        { ok: false, errors: { cv: error.message } },
        { status: 400 },
      )
    }
    console.error('[applications] no se pudo guardar', error)
    return json(
      {
        ok: false,
        message:
          'No pudimos recibir tu postulación en este momento. Inténtalo de nuevo en unos minutos.',
      },
      { status: 500 },
    )
  }
}

const CLOSED = {
  ok: false,
  hiring: false,
  message: 'Ya no estamos recibiendo postulaciones.',
} as const

export const Route = createFileRoute('/api/applications')({
  server: {
    handlers: {
      GET: () => json(CLOSED, { status: 410 }),
      POST: () => json(CLOSED, { status: 410 }),
    },
  },
})
