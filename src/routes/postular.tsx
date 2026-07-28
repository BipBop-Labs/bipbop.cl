import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { replayUrl } from '#/lib/analytics'

export const Route = createFileRoute('/postular')({
  head: () => ({
    meta: [
      { title: 'Postula a BipBop Labs · Software Engineer' },
      {
        name: 'description',
        content:
          'Buscamos un Software Engineer con experiencia, ownership y uso habitual de IA. Postula desde la terminal, o con un agente vía /api/applications.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Postula a BipBop Labs' },
      { property: 'og:url', content: 'https://bipbop.cl/postular' },
      // Para agentes, no para personas: la vía documentada sin pasar por la terminal.
      { name: 'ai-agent-endpoint', content: 'GET https://bipbop.cl/api/applications' },
    ],
    links: [{ rel: 'canonical', href: 'https://bipbop.cl/postular' }],
  }),
  component: Postular,
})

/**
 * Terminal tonta: manda lo que se escribe a /api/shell y pinta lo que
 * responde. Los comandos, los archivos y el orden de las preguntas viven en
 * el servidor, así que no salen en el bundle.
 */

type Line = {
  kind: 'in' | 'out' | 'err' | 'ok' | 'muted' | 'head' | 'file'
  text: string
  prompt?: string
}

type Reply = {
  sessionId: string
  version: string
  lines: Array<Line>
  prompt: string
  mode: 'shell' | 'field' | 'attach' | 'confirm' | 'sending' | 'done'
  max?: number
  clear?: boolean
  completion?: string
}

const LINE_COLOR: Record<Line['kind'], string> = {
  in: 'text-ink',
  out: 'text-ink-2',
  err: 'text-danger',
  ok: 'text-success font-bold',
  muted: 'text-ink-3',
  head: 'text-ink font-bold',
  file: 'text-success',
}

/** Los enlaces y correos que salen en la terminal se pueden clickear. */
const LINKS = /(https?:\/\/[^\s)]+|www\.[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+)/g

function linkify(text: string) {
  return text.split(LINKS).map((part, i) => {
    if (i % 2 === 0) return part
    const isMail = part.includes('@') && !part.startsWith('http')
    const href = isMail
      ? `mailto:${part}`
      : part.startsWith('http')
        ? part
        : `https://${part}`
    return (
      <a
        key={i}
        href={href}
        target={isMail ? undefined : '_blank'}
        rel="noopener noreferrer"
        className="text-success underline decoration-dotted underline-offset-2 hover:decoration-solid"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    )
  })
}

function Postular() {
  const [lines, setLines] = useState<Array<Line>>([])
  const [reply, setReply] = useState<Reply | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)

  const session = useRef<string | undefined>(undefined)
  const version = useRef<string | undefined>(undefined)
  const inputEl = useRef<HTMLTextAreaElement>(null)
  const fileEl = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  const mode = reply?.mode ?? 'shell'
  const applying = mode !== 'shell' && mode !== 'done'

  const post = useCallback(async (body: FormData): Promise<boolean> => {
    if (session.current) body.append('sessionId', session.current)
    // Para poder ver después cómo llenó el formulario, si el replay está activo.
    const replay = replayUrl()
    if (replay) body.append('replay', replay)
    setBusy(true)
    try {
      // Un despliegue dura segundos: vale la pena un segundo intento.
      let res: Response
      try {
        res = await fetch('/api/shell', { method: 'POST', body })
      } catch {
        await new Promise((r) => setTimeout(r, 1500))
        res = await fetch('/api/shell', { method: 'POST', body })
      }

      const data = (await res.json()) as Reply & { error?: string }
      if (data.error) {
        setLines((prev) => [...prev, { kind: 'err', text: data.error! }])
        return false
      }

      session.current = data.sessionId
      try {
        localStorage.setItem('postular', data.sessionId)
      } catch {
        /* modo incógnito o sin permisos: se sigue igual */
      }

      // El servidor se reinició con otra versión mientras estábamos acá.
      const stale = version.current && version.current !== data.version
      version.current = data.version

      setReply(data)
      setLines((prev) => [
        ...(data.clear ? [] : prev),
        ...data.lines,
        ...(stale
          ? [
              {
                kind: 'muted' as const,
                text: 'Publicamos una versión nueva del sitio. Recarga la página cuando quieras, no vas a perder nada de lo que llevas escrito.',
              },
            ]
          : []),
      ])
      if (data.mode === 'done') {
        try {
          localStorage.removeItem('postular')
        } catch {
          /* da lo mismo */
        }
      }
      return true
    } catch {
      setLines((prev) => [
        ...prev,
        {
          kind: 'err',
          text: 'No pudimos hablar con el servidor. Presiona Enter para reintentar, tu texto sigue acá.',
        },
        {
          kind: 'muted',
          text: 'Si se repite, avísanos: https://github.com/BipBop-Labs/bipbop.cl/issues/new',
        },
      ])
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  // Saludo inicial, retomando la sesión que haya quedado de antes.
  useEffect(() => {
    // ?s=<id> retoma una postulación desde el enlace de rescate.
    const fromLink = new URLSearchParams(location.search).get('s')
    if (fromLink) {
      session.current = fromLink
      history.replaceState(null, '', location.pathname)
    }
    try {
      if (fromLink) localStorage.setItem('postular', fromLink)
      else session.current = localStorage.getItem('postular') ?? undefined
    } catch {
      /* sin localStorage se empieza de cero */
    }
    const body = new FormData()
    body.append('greet', '1')
    void post(body)
  }, [post])

  // El campo crece con lo que se escribe, sin pasarse de la mitad de la caja.
  useEffect(() => {
    const el = inputEl.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }, [input])

  // La terminal siempre muestra lo último.
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
    if (!busy && mode !== 'done') inputEl.current?.focus()
  }, [lines, busy, mode])

  // Avisa si se va con la postulación a medias.
  useEffect(() => {
    if (!applying) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [applying])

  const sendFile = useCallback(
    (file: File | null | undefined) => {
      if (!file || busy) return
      const body = new FormData()
      body.append('cv', file)
      void post(body)
    },
    [busy, post],
  )

  async function complete() {
    const body = new FormData()
    body.append('complete', '1')
    body.append('input', input)
    if (session.current) body.append('sessionId', session.current)
    try {
      const res = await fetch('/api/shell', { method: 'POST', body })
      const data = (await res.json()) as Reply
      if (data.completion !== undefined) setInput(data.completion)
      if (data.lines?.length) setLines((prev) => [...prev, ...data.lines])
    } catch {
      /* si falla el autocompletado no pasa nada */
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Tab') {
      event.preventDefault()
      if (!busy) void complete()
      return
    }
    // Enter envía; Shift+Enter salta de línea, para respuestas largas.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit(event)
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return

    // En el paso del CV, Enter vacío abre el selector de archivos.
    if (mode === 'attach' && !input.trim()) {
      fileEl.current?.click()
      return
    }

    const body = new FormData()
    body.append('input', input)
    // Se borra recién cuando el servidor lo recibió: si falla, no se pierde.
    if (await post(body)) setInput('')
  }

  const over = reply?.max ? input.length > reply.max : false

  return (
    <main
      className="mx-auto min-h-screen max-w-[900px] px-4 py-8 font-mono text-[0.9rem] max-[720px]:px-3 max-[720px]:py-4"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        sendFile(e.dataTransfer.files?.[0])
      }}
    >
      <div
        className={`flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-[4px] border bg-surface transition-colors max-[720px]:h-[calc(100dvh-2rem)] ${
          dragging ? 'border-success' : 'border-line'
        }`}
        onClick={() => inputEl.current?.focus()}
      >
        <header className="flex items-center gap-2 border-b border-line px-4 py-2 text-[0.72rem] tracking-[0.1em] text-ink-3 uppercase">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
          bipbop.cl / postular
          <span className="ml-auto normal-case tracking-normal">
            {dragging ? 'suelta el PDF' : 'juan@bipbop.cl'}
          </span>
        </header>

        <div
          ref={scroller}
          className="flex-1 overflow-y-auto px-4 py-3"
          role="log"
          aria-live="polite"
          aria-label="Salida de la terminal"
        >
          {lines.map((line, i) => (
            <p
              key={i}
              className={`whitespace-pre-wrap ${LINE_COLOR[line.kind]}`}
            >
              {line.kind === 'in' ? (
                <span className="text-success">{line.prompt ?? '$'} </span>
              ) : null}
              {line.text ? linkify(line.text) : ' '}
            </p>
          ))}

          {busy ? <p className="text-ink-3">…</p> : null}
        </div>

        {mode === 'done' ? null : (
          <form
            onSubmit={onSubmit}
            className="flex items-start gap-2 border-t border-line px-4 py-3"
          >
            <label className="shrink-0 pt-px text-success" htmlFor="cmd">
              {reply?.prompt ?? '$'}
            </label>
            <textarea
              id="cmd"
              ref={inputEl}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              enterKeyHint="send"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={applying}
              aria-label={applying ? 'Respuesta' : 'Comando de la terminal'}
              className="min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent font-mono text-ink caret-success outline-none disabled:opacity-50 max-[720px]:text-[16px]"
            />
            {reply?.max ? (
              <span
                className={`shrink-0 self-end text-[0.75rem] tabular-nums ${over ? 'text-danger' : 'text-ink-3'}`}
              >
                {input.length}/{reply.max}
              </span>
            ) : null}
            {mode === 'attach' ? (
              <button
                type="button"
                onClick={() => fileEl.current?.click()}
                className="shrink-0 cursor-pointer border-b border-success text-[0.78rem] text-success"
              >
                elegir PDF
              </button>
            ) : null}
          </form>
        )}
      </div>

      <input
        ref={fileEl}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          sendFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

    </main>
  )
}
