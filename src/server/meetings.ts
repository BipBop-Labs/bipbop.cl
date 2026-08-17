import { getDb } from './db'
import { notifyDiscord } from './applications'

/**
 * La agenda de entrevistas. Misma idea que la terminal —el servidor manda, el
 * navegador solo pinta— pero otro contexto: una pizarra de embarque con los
 * bloques de mañana. El postulante entra con el id de su postulación, elige
 * uno y eso sale a Discord, que es donde vive todo lo demás.
 */

const TZ = 'America/Santiago'
/** Bloques de 45 minutos con 15 de aire entre uno y otro, 9 a 12. */
const HORAS = [9, 10, 11]
const DURACION = 45
const SITE = process.env.SITE_URL || 'https://bipbop.cl'

export type Slot = {
  /** `YYYY-MM-DD HH:mm`, hora de Chile. */
  id: string
  label: string
  taken: boolean
  mine: boolean
}

function ensure() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      slot           TEXT PRIMARY KEY,
      application_id TEXT NOT NULL UNIQUE,
      booked_at      INTEGER NOT NULL
    );
  `)
}

/**
 * Mañana en Chile, como fecha de pared. No guardamos instantes UTC a
 * propósito: la entrevista es a las nueve de la mañana en Santiago, y esa
 * frase no cambia con el horario de verano.
 */
export function tomorrow(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now + 24 * 60 * 60 * 1000))
}

function label(id: string): string {
  const [day, time] = id.split(' ')
  const [h, m] = time.split(':').map(Number)
  const fin = `${String(h + Math.floor((m + DURACION) / 60)).padStart(2, '0')}:${String((m + DURACION) % 60).padStart(2, '0')}`
  // Mediodía UTC para que el día no se corra al formatear con la zona.
  const fecha = new Intl.DateTimeFormat('es-CL', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${day}T12:00:00Z`))
  return `${fecha} · ${time}–${fin}`
}

function booked(): Map<string, string> {
  ensure()
  const rows = getDb()
    .prepare('SELECT slot, application_id FROM meetings')
    .all() as Array<{ slot: string; application_id: string }>
  return new Map(rows.map((r) => [r.slot, r.application_id]))
}

export function slots(applicationId: string, now = Date.now()): Array<Slot> {
  const day = tomorrow(now)
  const ocupados = booked()
  return HORAS.map((h) => {
    const id = `${day} ${String(h).padStart(2, '0')}:00`
    const de = ocupados.get(id)
    return { id, label: label(id), taken: Boolean(de), mine: de === applicationId }
  })
}

export function candidate(
  applicationId: string,
): { fullName: string; email: string } | undefined {
  const row = getDb()
    .prepare('SELECT full_name, email FROM applications WHERE id = ?')
    .get(applicationId) as { full_name: string; email: string } | undefined
  return row ? { fullName: row.full_name, email: row.email } : undefined
}

/**
 * Reserva, o cambia la que ya tenía. El PRIMARY KEY del slot es lo que impide
 * que dos personas queden a la misma hora; no hace falta un candado aparte.
 */
export async function book(
  applicationId: string,
  slot: string,
  now = Date.now(),
): Promise<{ ok: boolean; error?: string }> {
  const quien = candidate(applicationId)
  if (!quien) return { ok: false, error: 'no encontramos tu postulación' }

  const disponible = slots(applicationId, now).find((s) => s.id === slot)
  if (!disponible) return { ok: false, error: 'ese bloque no existe' }
  if (disponible.taken && !disponible.mine) {
    return { ok: false, error: 'alguien tomó ese bloque' }
  }
  if (disponible.mine) return { ok: true }

  const db = getDb()
  try {
    db.exec('BEGIN IMMEDIATE')
    db.prepare('DELETE FROM meetings WHERE application_id = ?').run(applicationId)
    db.prepare(
      'INSERT INTO meetings (slot, application_id, booked_at) VALUES (?, ?, ?)',
    ).run(slot, applicationId, now)
    db.exec('COMMIT')
  } catch {
    db.exec('ROLLBACK')
    return { ok: false, error: 'alguien tomó ese bloque' }
  }

  await notifyDiscord(
    [
      '⠀',
      '# 📅 ENTREVISTA AGENDADA',
      '',
      `## ${quien.fullName}`,
      quien.email,
      `-# ${label(slot)} · hora de Chile · 45 min`,
      `-# 🔎 [abrir en el panel](${SITE}/admin?a=${applicationId})`,
    ].join('\n'),
  ).catch((error: unknown) => {
    // La reserva ya está guardada: si Discord falla, se ve igual en /admin.
    console.error('[meetings] no se pudo avisar a Discord:', error)
  })

  return { ok: true }
}

/** Para el panel: qué agendó cada quien. */
export function listMeetings(): Array<{
  slot: string
  label: string
  applicationId: string
}> {
  ensure()
  return (
    getDb()
      .prepare('SELECT slot, application_id FROM meetings ORDER BY slot')
      .all() as Array<{ slot: string; application_id: string }>
  ).map((r) => ({
    slot: r.slot,
    label: label(r.slot),
    applicationId: r.application_id,
  }))
}

/** Borrar desde /admin: libera el bloque para quien venga. */
export function cancel(applicationId: string): boolean {
  ensure()
  const { changes } = getDb()
    .prepare('DELETE FROM meetings WHERE application_id = ?')
    .run(applicationId)
  return Number(changes) > 0
}
