import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import { listRepos } from '#/server/repos'

export const Route = createFileRoute('/api/repos')({
  server: {
    handlers: {
      GET: async () => {
        try {
          return json({ repos: await listRepos() })
        } catch (error) {
          console.error('[repos] github no respondió', error)
          return json({ repos: [] }, { status: 200 })
        }
      },
    },
  },
})
