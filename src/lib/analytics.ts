import posthog from 'posthog-js'

const POSTHOG_KEY = 'phc_vV7uhj3BzAYpkDShBAcA6npE7i6zT6YyhAQwsZZup9oV'

let started = false

export function startAnalytics() {
  if (started || typeof window === 'undefined') return
  started = true
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-01-30',
  })
}

/**
 * Enlace a la grabación de esta sesión, apuntando al momento actual. Vacío si
 * el replay está apagado en el proyecto o PostHog todavía no arranca.
 */
export function replayUrl(): string {
  if (typeof window === 'undefined') return ''
  try {
    return posthog.get_session_replay_url?.({ withTimestamp: true }) ?? ''
  } catch {
    return ''
  }
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(event, props)
}
