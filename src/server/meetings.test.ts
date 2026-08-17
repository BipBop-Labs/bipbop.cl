import { mkdtemp } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { closeDb, getDb } from './db'
import { fakeDiscord } from './discord-fake'
import { book, cancel, listMeetings, slots, tomorrow } from './meetings'

/** Una postulación mínima, que es lo único que la agenda mira. */
function postulante(nombre: string): string {
  const id = randomUUID()
  getDb()
    .prepare(
      `INSERT INTO applications (
         id, created_at, status, source, flag, full_name, email, github,
         linkedin, project, answer_project, answer_simplicity, answer_ai,
         cv, cv_name, cv_size
       ) VALUES (?, ?, 'new', 'terminal', 0, ?, ?, '', '', '', '', '', '', ?, 'cv.pdf', 1)`,
    )
    .run(id, Date.now(), nombre, `${nombre}@example.com`, new Uint8Array([1]))
  return id
}

beforeEach(async () => {
  closeDb()
  process.env.DATA_DIR = await mkdtemp(join(tmpdir(), 'bipbop-db-'))
  process.env.DISCORD_WEBHOOK_URL = 'https://discord.test/webhook'
  fakeDiscord()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('agenda', () => {
  it('ofrece tres bloques de mañana, de 9 a 12', () => {
    const id = postulante('ada')
    const libres = slots(id)

    expect(libres.map((s) => s.id)).toEqual([
      `${tomorrow()} 09:00`,
      `${tomorrow()} 10:00`,
      `${tomorrow()} 11:00`,
    ])
    expect(libres[0].label).toContain('09:00–09:45')
    expect(libres.every((s) => !s.taken)).toBe(true)
  })

  it('no deja que dos personas tomen el mismo bloque', async () => {
    const ada = postulante('ada')
    const alan = postulante('alan')
    const bloque = `${tomorrow()} 10:00`

    expect(await book(ada, bloque)).toEqual({ ok: true })
    expect((await book(alan, bloque)).ok).toBe(false)

    expect(slots(alan).find((s) => s.id === bloque)).toMatchObject({
      taken: true,
      mine: false,
    })
  })

  it('cambiar de bloque libera el anterior, y borrar lo libera todo', async () => {
    const ada = postulante('ada')

    await book(ada, `${tomorrow()} 09:00`)
    await book(ada, `${tomorrow()} 11:00`)

    expect(listMeetings().map((m) => m.slot)).toEqual([`${tomorrow()} 11:00`])

    expect(cancel(ada)).toBe(true)
    expect(listMeetings()).toEqual([])
    expect(slots(ada).every((s) => !s.taken)).toBe(true)
  })

  it('rechaza un bloque inventado', async () => {
    const ada = postulante('ada')
    expect((await book(ada, '2020-01-01 03:00')).ok).toBe(false)
  })
})
