import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import { isRateLimited, recordHit } from '#/server/applications'
import { book, candidate, slots } from '#/server/meetings'

/**
 * Backend de /agenda. El id de la postulación es la llave: es un UUID, así
 * que no se adivina, y sin él no se ve ni se reserva nada.
 */

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export const Route = createFileRoute('/api/agenda')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = clientIp(request)
        if (isRateLimited(ip, 'origin')) {
          return json({ error: 'demasiadas peticiones' }, { status: 429 })
        }
        recordHit(ip, 'origin')

        const body = (await request.json().catch(() => ({}))) as {
          id?: string
          slot?: string
        }
        const id = body.id ?? ''
        const quien = candidate(id)
        if (!quien) return json({ error: 'invitación no válida' }, { status: 404 })

        if (body.slot) {
          const result = await book(id, body.slot)
          if (!result.ok) return json({ error: result.error }, { status: 409 })
        }

        return json({ name: quien.fullName.split(' ')[0], slots: slots(id) })
      },
    },
  },
})
