import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type { Slot } from '#/server/meetings'

export const Route = createFileRoute('/agenda')({
  head: () => ({
    meta: [
      { title: 'Agenda tu entrevista · BipBop Labs' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: Agenda,
})

/**
 * Pizarra de embarque: los bloques de mañana, uno se toma y listo. La misma
 * idea que la terminal —el servidor decide, el navegador pinta— con otro
 * decorado. La invitación es `/agenda?a=<id de la postulación>`.
 */

type Reply = { name?: string; slots?: Array<Slot>; error?: string }

function Agenda() {
  const [state, setState] = useState<Reply | null>(null)
  const [busy, setBusy] = useState(false)

  const id =
    typeof window === 'undefined'
      ? ''
      : new URLSearchParams(window.location.search).get('a') || ''

  const post = async (slot?: string) => {
    setBusy(true)
    const res = await fetch('/api/agenda', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, slot }),
    })
    const data = (await res.json().catch(() => ({}))) as Reply
    // Un choque devuelve el error, pero también la pizarra al día.
    setState((prev) => ({ ...prev, ...data }))
    setBusy(false)
  }

  useEffect(() => {
    void post()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const slots = state?.slots ?? []
  const mine = slots.find((s) => s.mine)

  return (
    <main className="mx-auto min-h-screen max-w-[640px] px-4 py-12 font-mono text-[0.9rem]">
      <div className="overflow-hidden rounded-[4px] border border-line bg-surface">
        <header className="flex items-center gap-2 border-b border-line px-4 py-2 text-[0.72rem] tracking-[0.1em] text-ink-3 uppercase">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
          bipbop.cl / agenda
          <span className="ml-auto normal-case tracking-normal">
            45 min · hora de Chile
          </span>
        </header>

        <div className="px-4 py-6">
          {state?.error && !slots.length ? (
            <p className="text-danger">{state.error}</p>
          ) : (
            <>
              <p className="text-ink">
                {state?.name ? `Hola ${state.name}.` : '…'}
              </p>
              <p className="mt-1 text-ink-2">
                Nos gustó tu postulación. Elige un bloque para conversar:
              </p>

              <ul className="mt-6 flex flex-col gap-2">
                {slots.map((slot) => (
                  <li key={slot.id}>
                    <button
                      type="button"
                      disabled={busy || (slot.taken && !slot.mine)}
                      onClick={() => void post(slot.id)}
                      className={`flex w-full items-center gap-3 rounded-[4px] border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed ${
                        slot.mine
                          ? 'border-success bg-success-soft text-ink'
                          : slot.taken
                            ? 'border-line text-ink-3 line-through'
                            : 'border-line text-ink hover:border-success hover:text-success'
                      }`}
                    >
                      <span className="text-success">
                        {slot.mine ? '>' : slot.taken ? 'x' : ' '}
                      </span>
                      {slot.label}
                      <span className="ml-auto text-[0.72rem] tracking-[0.1em] text-ink-3 uppercase">
                        {slot.mine ? 'tuyo' : slot.taken ? 'tomado' : 'libre'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {state?.error ? (
                <p className="mt-4 text-danger">{state.error}</p>
              ) : null}

              <p className="mt-6 text-ink-3">
                {mine
                  ? 'Listo, te esperamos. Puedes cambiarlo eligiendo otro bloque.'
                  : 'Si ninguno te sirve, escríbenos a juan@bipbop.cl.'}
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
