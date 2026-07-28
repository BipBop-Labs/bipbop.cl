import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import { MAX_CV_BYTES } from '#/lib/application'
import { checkRateLimit } from '#/server/applications'
import { completeInput, greet, runAttach, runShell } from '#/server/shell'

/**
 * La terminal de /postular. El cliente manda lo que se escribió (o el PDF) y
 * recibe líneas: toda la lógica del shell se queda de este lado.
 */

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export const Route = createFileRoute('/api/shell')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let form: FormData
        try {
          form = await request.formData()
        } catch {
          return json({ error: 'formulario ilegible' }, { status: 400 })
        }

        const sessionId = (form.get('sessionId') as string) || undefined
        const cv = form.get('cv')

        // El saludo inicial no consume cuota: es solo abrir la página.
        if (form.get('greet')) return json(greet(sessionId))

        if (!checkRateLimit(clientIp(request), 'shell')) {
          return json({ error: 'demasiadas peticiones, espera un momento' }, { status: 429 })
        }

        if (form.get('complete')) {
          return json(
            completeInput(sessionId, String(form.get('input') ?? '')),
          )
        }

        if (cv instanceof File) {
          if (cv.size > MAX_CV_BYTES) {
            return json({ error: 'archivo muy grande' }, { status: 413 })
          }
          const bytes = new Uint8Array(await cv.arrayBuffer())
          return json(
            runAttach(sessionId, { bytes, name: cv.name, type: cv.type }),
          )
        }

        const input = String(form.get('input') ?? '')
        return json(await runShell(sessionId, input, clientIp(request)))
      },
    },
  },
})
