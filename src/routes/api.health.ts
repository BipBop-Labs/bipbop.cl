import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

/** Proof of life for the Nitro server behind the site. */
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => json({ ok: true, service: 'bipbop.cl' }),
    },
  },
})
