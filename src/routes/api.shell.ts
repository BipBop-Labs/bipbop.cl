import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/shell')({
  server: {
    handlers: {
      POST: () =>
        json(
          { error: 'Ya no estamos recibiendo postulaciones.' },
          { status: 410 },
        ),
    },
  },
})
