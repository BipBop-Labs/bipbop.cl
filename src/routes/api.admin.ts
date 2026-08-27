import { timingSafeEqual } from 'node:crypto'

import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import { getCv, listApplications, redeliver } from '#/server/applications'
import { exportDb } from '#/server/db'
import { cancel, listMeetings } from '#/server/meetings'
import { listPendingSessions } from '#/server/shell'

/**
 * Lo que consume /admin. La llave va en el cuerpo, nunca en la URL, para que
 * no quede en logs ni en el historial del navegador.
 */

function keyMatches(given: string): boolean {
  // Con trim a los dos lados: `openssl rand -base64 32` termina en salto de
  // línea, y ese salto invisible viaja tanto al pegar la llave en el panel
  // como al configurarla en el servidor. Sin esto la llave correcta da 401.
  const expected = process.env.ADMIN_KEY?.trim()
  // Sin llave configurada el panel queda cerrado, no abierto.
  if (!expected || expected.length < 16) return false

  const a = Buffer.from(given.trim())
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export const Route = createFileRoute('/api/admin')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          key?: string
          action?: string
          id?: string
        }

        if (!keyMatches(body.key ?? '')) {
          return json({ ok: false }, { status: 401 })
        }

        switch (body.action) {
          case 'list':
            return json({
              ok: true,
              applications: listApplications(),
              pending: listPendingSessions(),
              meetings: listMeetings(),
            })

          case 'unbook': {
            if (!body.id) return json({ ok: false }, { status: 400 })
            cancel(body.id)
            return json({ ok: true, meetings: listMeetings() })
          }

          case 'export': {
            const bytes = await exportDb()
            const date = new Date().toISOString().slice(0, 10)
            return new Response(bytes as BufferSource, {
              headers: {
                'content-type': 'application/vnd.sqlite3',
                'content-disposition': `attachment; filename="bipbop-${date}.db"`,
                'cache-control': 'no-store',
                'x-content-type-options': 'nosniff',
              },
            })
          }

          case 'cv': {
            const cv = body.id ? getCv(body.id) : undefined
            if (!cv) return json({ ok: false }, { status: 404 })
            return new Response(cv.bytes as BufferSource, {
              headers: {
                'content-type': 'application/pdf',
                'content-disposition': `attachment; filename="${cv.name.replace(/[^\w.-]/g, '_')}"`,
              },
            })
          }

          case 'retry': {
            if (!body.id) return json({ ok: false }, { status: 400 })
            const sent = await redeliver(body.id)
            return json({
              ok: sent,
              applications: listApplications(),
              pending: listPendingSessions(),
            })
          }

          default:
            return json({ ok: false }, { status: 400 })
        }
      },
    },
  },
})
