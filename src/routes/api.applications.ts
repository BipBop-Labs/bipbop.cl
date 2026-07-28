import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import {
  EMPTY_FIELDS,
  MAX_CV_BYTES,
  normalizeFields,
  validate,
  hasErrors,
} from '#/lib/application'
import type { ApplicationFields, Errors } from '#/lib/application'
import {
  CvRejected,
  checkRateLimit,
  isDuplicate,
  submitApplication,
} from '#/server/applications'

/** Tiempo mínimo verosímil entre abrir el formulario y enviarlo. */
const MIN_FILL_MS = 3000

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function readFields(form: FormData): ApplicationFields {
  const fields = { ...EMPTY_FIELDS }
  for (const key of Object.keys(fields) as Array<keyof ApplicationFields>) {
    const value = form.get(key)
    fields[key] = typeof value === 'string' ? value : ''
  }
  return fields
}

export const Route = createFileRoute('/api/applications')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return json(
            { ok: false, message: 'No pudimos leer el formulario.' },
            { status: 400 },
          )
        }

        // Trampa para bots: el campo va oculto, una persona nunca lo llena.
        if ((form.get('website') as string)?.trim()) {
          return json({ ok: true, id: 'ignored' })
        }

        const startedAt = Number(form.get('startedAt'))
        if (
          Number.isFinite(startedAt) &&
          Date.now() - startedAt < MIN_FILL_MS
        ) {
          return json(
            { ok: false, message: 'Tómate un momento y vuelve a enviar.' },
            { status: 400 },
          )
        }

        if (!checkRateLimit(clientIp(request))) {
          return json(
            {
              ok: false,
              message: 'Demasiados envíos. Inténtalo de nuevo más tarde.',
            },
            { status: 429 },
          )
        }

        const fields = normalizeFields(readFields(form))
        const cv = form.get('cv')
        const cvMeta =
          cv instanceof File
            ? { name: cv.name, size: cv.size, type: cv.type }
            : null

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
          const record = await submitApplication(fields, {
            bytes,
            name: (cv as File).name,
          })
          return json({ ok: true, id: record.id })
        } catch (error) {
          if (error instanceof CvRejected) {
            return json(
              { ok: false, errors: { cv: error.message } },
              { status: 400 },
            )
          }
          console.error('[applications] no se pudo entregar', error)
          return json(
            {
              ok: false,
              message:
                'No pudimos recibir tu postulación en este momento. Inténtalo de nuevo en unos minutos.',
            },
            { status: 502 },
          )
        }
      },
    },
  },
})
