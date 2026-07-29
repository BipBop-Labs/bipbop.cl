import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      { title: 'Postulaciones · BipBop Labs' },
      { name: 'robots', content: 'noindex,nofollow' },
    ],
  }),
  component: Admin,
})

type Trace = { at: number; text: string }

type Application = {
  id: string
  createdAt: string
  source: 'terminal' | 'api'
  flag: boolean
  fullName: string
  email: string
  github: string
  linkedin: string
  project: string
  answerProject: string
  answerSimplicity: string
  answerAi: string
  answerCase: string
  answerAsk: string
  cvName: string
  cvSize: number
  replayUrl: string
  activity: Array<Trace>
  deliveredAt: string | null
  deliveryError: string | null
}

type Pending = {
  id: string
  startedAt: string
  lastSeenAt: string
  step: number
  steps: number
  fullName: string
  email: string
  hasCv: boolean
  written: number
  replay: string
  log: Array<Trace>
  draft: {
    github: string
    linkedin: string
    project: string
    answerProject: string
    answerSimplicity: string
    answerAi: string
    answerCase: string
    answerAsk: string
  }
}

const QUESTIONS: Array<[keyof Application, string]> = [
  ['answerProject', 'Lo que construiste'],
  ['answerSimplicity', 'Ownership y simplificación'],
  ['answerAi', 'Trabajo con IA'],
  ['answerCase', 'El caso'],
  ['answerAsk', 'Lo que nos preguntaría'],
]

/** Lo que hizo en la terminal antes de postular. */
function Bitacora({ log, replay }: { log: Array<Trace>; replay: string }) {
  if (!log.length && !replay) return null

  return (
    <details className="mt-3 border-t border-line pt-2">
      <summary className="cursor-pointer text-[0.8rem] text-ink-3">
        Qué hizo en la terminal ({log.length} pasos
        {log.filter((t) => t.text.startsWith('📋')).length > 0
          ? `, ${log.filter((t) => t.text.startsWith('📋')).length} de copiar y pegar`
          : ''}
        )
      </summary>

      {replay ? (
        <p className="mt-3">
          <a
            href={replay}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-success text-[0.85rem] text-success no-underline"
          >
            🎥 Ver la grabación en PostHog
          </a>
        </p>
      ) : null}

      <ol className="mt-3 grid gap-1 font-mono text-[0.78rem]">
        {log.map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 text-ink-3">
              {new Date(t.at).toLocaleTimeString('es-CL')}
            </span>
            <span
              className={
                t.text.startsWith('$')
                  ? 'text-success'
                  : t.text.startsWith('⇥')
                    ? 'text-ink-3'
                    : t.text.startsWith('📋')
                      ? 'text-danger'
                      : 'text-ink-2'
              }
            >
              {t.text}
            </span>
          </li>
        ))}
      </ol>
    </details>
  )
}

function Admin() {
  const [key, setKey] = useState('')
  const [apps, setApps] = useState<Array<Application> | null>(null)
  const [pending, setPending] = useState<Array<Pending>>([])
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const call = useCallback(
    async (body: Record<string, unknown>, adminKey: string) =>
      fetch('/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body, key: adminKey }),
      }),
    [],
  )

  const load = useCallback(
    async (adminKey: string) => {
      setBusy(true)
      setError('')
      try {
        const res = await call({ action: 'list' }, adminKey)
        if (res.status === 401) {
          setError('Llave incorrecta.')
          sessionStorage.removeItem('adminKey')
          setApps(null)
          return
        }
        const data = (await res.json()) as {
          applications: Array<Application>
          pending: Array<Pending>
        }
        setApps(data.applications)
        setPending(data.pending ?? [])
        sessionStorage.setItem('adminKey', adminKey)
        setKey(adminKey)
      } catch {
        setError('No pudimos conectar.')
      } finally {
        setBusy(false)
      }
    },
    [call],
  )

  useEffect(() => {
    const saved = sessionStorage.getItem('adminKey')
    if (saved) void load(saved)
  }, [load])

  // Al llegar desde el enlace de Discord, saltar a esa postulación.
  useEffect(() => {
    if (!apps?.length) return
    const buscada = new URLSearchParams(location.search).get('a')
    if (!buscada) return
    document
      .getElementById(`app-${buscada}`)
      ?.scrollIntoView({ block: 'center' })
  }, [apps])

  async function downloadCv(app: Application) {
    const res = await call({ action: 'cv', id: app.id }, key)
    if (!res.ok) return
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = app.cvName || 'cv.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function retry(app: Application) {
    setBusy(true)
    const res = await call({ action: 'retry', id: app.id }, key)
    const data = (await res.json()) as {
      applications?: Array<Application>
      pending?: Array<Pending>
    }
    if (data.applications) setApps(data.applications)
    if (data.pending) setPending(data.pending)
    setBusy(false)
  }

  if (!apps) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-6">
        <h1 className="mb-6 text-[1.4rem] font-semibold">Postulaciones</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void load(key)
          }}
        >
          <label className="block text-[0.62rem] tracking-[0.15em] text-ink-3 uppercase">
            Llave
          </label>
          <input
            type="password"
            value={key}
            autoFocus
            onChange={(e) => setKey(e.target.value)}
            className="mt-2 w-full border-0 border-b border-line bg-transparent py-2 font-mono text-ink outline-none focus:border-success"
          />
          {error ? (
            <p className="mt-2 text-[0.8rem] text-danger">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="mt-6 cursor-pointer rounded-[2px] border border-success bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-5 py-2 text-[0.9rem] font-bold text-success disabled:opacity-50"
          >
            {busy ? 'Abriendo…' : 'Abrir'}
          </button>
        </form>
      </main>
    )
  }

  const pendientes = apps.filter((a) => !a.deliveredAt).length
  const destacada =
    typeof location === 'undefined'
      ? null
      : new URLSearchParams(location.search).get('a')

  return (
    <main className="mx-auto max-w-[880px] px-6 py-16">
      <header className="mb-10 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
        <h1 className="text-[1.4rem] font-semibold">
          Postulaciones{' '}
          <span className="font-normal text-ink-3">({apps.length})</span>
        </h1>
        {pendientes > 0 ? (
          <span className="text-[0.85rem] text-danger">
            {pendientes} sin entregar a Discord
          </span>
        ) : (
          <span className="text-[0.85rem] text-ink-3">
            todas entregadas a Discord
          </span>
        )}
      </header>

      {pending.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-1 text-[0.62rem] tracking-[0.15em] text-ink-3 uppercase">
            A medio terminar ({pending.length})
          </h2>
          <p className="mb-4 max-w-[62ch] text-[0.85rem] text-ink-3">
            El enlace retoma la postulación donde quedó. Mándaselo solo a la
            persona que la empezó: quien lo tenga puede seguir escribiendo por
            ella.
          </p>

          <div className="grid gap-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="rounded-[4px] border border-line bg-surface px-4 py-3 text-[0.85rem]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-ink">
                    {p.fullName || (
                      <span className="text-ink-3">sin nombre</span>
                    )}
                    {p.email ? (
                      <span className="text-ink-2"> · {p.email}</span>
                    ) : null}
                  </span>
                  <span className="text-ink-3">
                    paso {p.step}/{p.steps}
                    {p.hasCv ? ' · con CV' : ''}
                    {p.written > 0 ? ` · ${p.written} caracteres` : ''}
                    {' · '}
                    {new Date(p.lastSeenAt).toLocaleString('es-CL')}
                  </span>
                  <button
                    onClick={() => {
                      const link = `${location.origin}/postular?s=${p.id}`
                      void navigator.clipboard.writeText(link)
                      setCopied(p.id)
                    }}
                    className="cursor-pointer border-b border-success text-success"
                  >
                    {copied === p.id ? 'copiado' : 'copiar enlace'}
                  </button>
                </div>

                <Bitacora log={p.log ?? []} replay={p.replay} />

                {p.written > 0 || p.draft.project ? (
                  <details className="mt-2 border-t border-line pt-2">
                    <summary className="cursor-pointer text-[0.8rem] text-ink-3">
                      Ver lo que lleva escrito
                    </summary>
                    <div className="mt-3 grid gap-3">
                      {p.draft.project ? (
                        <p className="text-ink-2">
                          <span className="text-ink-3">proyecto: </span>
                          {p.draft.project}
                        </p>
                      ) : null}
                      {QUESTIONS.map(([field, title]) => {
                        const value = p.draft[field as keyof typeof p.draft]
                        if (!value) return null
                        return (
                          <div key={field}>
                            <p className="mb-1 text-[0.62rem] tracking-[0.15em] text-ink-3 uppercase">
                              {title}
                            </p>
                            <p className="max-w-[70ch] whitespace-pre-wrap text-ink-2">
                              {value}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {apps.length === 0 ? (
        <p className="text-ink-2">Todavía no llega ninguna.</p>
      ) : null}

      <div className="grid gap-6">
        {apps.map((app) => (
          <article
            key={app.id}
            id={`app-${app.id}`}
            className={`rounded-[6px] border bg-surface p-6 ${
              app.id === destacada ? 'border-success' : 'border-line'
            }`}
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-[1.15rem] font-semibold">{app.fullName}</h2>
                <a
                  className="text-[0.9rem] text-ink-2 no-underline hover:text-success"
                  href={`mailto:${app.email}`}
                >
                  {app.email}
                </a>
              </div>
              <div className="text-right text-[0.75rem] text-ink-3">
                <div>{new Date(app.createdAt).toLocaleString('es-CL')}</div>
                <div>
                  {app.source === 'api' ? '🤖 agente' : '⌨️ terminal'}
                  {app.flag ? ' · 🔑 flag' : ''}
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.85rem]">
              {[
                ['GitHub', app.github],
                ['LinkedIn', app.linkedin],
                ['Proyecto', app.project],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-line text-ink-2 no-underline hover:border-success hover:text-success"
                >
                  {label}
                </a>
              ))}
              <button
                onClick={() => void downloadCv(app)}
                className="cursor-pointer border-b border-line text-ink-2 hover:border-success hover:text-success"
              >
                CV ({Math.ceil(app.cvSize / 1024)} KB)
              </button>
            </div>

            {QUESTIONS.map(([field, title]) => (
              <div key={field} className="mb-4">
                <p className="mb-1 text-[0.62rem] tracking-[0.15em] text-ink-3 uppercase">
                  {title}
                </p>
                <p className="max-w-[70ch] text-[0.95rem] whitespace-pre-wrap text-ink-2">
                  {String(app[field])}
                </p>
              </div>
            ))}

            <Bitacora log={app.activity ?? []} replay={app.replayUrl} />

            {app.deliveredAt ? null : (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <span className="text-[0.8rem] text-danger">
                  No llegó a Discord: {app.deliveryError}
                </span>
                <button
                  onClick={() => void retry(app)}
                  disabled={busy}
                  className="cursor-pointer rounded-[2px] border border-success px-3 py-1 text-[0.8rem] text-success disabled:opacity-50"
                >
                  Reenviar
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  )
}
