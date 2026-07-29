import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

/**
 * SQLite, con el módulo que ya trae Node: sin dependencias ni un contenedor
 * aparte. Guarda las sesiones de la terminal a medio llenar y las
 * postulaciones completas, con el CV adentro.
 */

let db: DatabaseSync | null = null

function dataDir(): string {
  return process.env.DATA_DIR || './data'
}

export function getDb(): DatabaseSync {
  if (db) return db

  const dir = dataDir()
  mkdirSync(dir, { recursive: true })
  db = new DatabaseSync(join(dir, 'bipbop.db'))

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL,
      state       TEXT NOT NULL,
      cv          BLOB,
      cv_name     TEXT
    );

    -- Las postulaciones son nuestras: se guardan acá y de acá salen a
    -- Discord. Si el webhook falla, no se pierde nada y se puede reenviar.
    CREATE TABLE IF NOT EXISTS applications (
      id                TEXT PRIMARY KEY,
      created_at        INTEGER NOT NULL,
      status            TEXT NOT NULL,
      source            TEXT NOT NULL,
      flag              INTEGER NOT NULL DEFAULT 0,
      full_name         TEXT NOT NULL,
      email             TEXT NOT NULL,
      github            TEXT NOT NULL,
      linkedin          TEXT NOT NULL,
      project           TEXT NOT NULL,
      answer_project    TEXT NOT NULL,
      answer_simplicity TEXT NOT NULL,
      answer_ai         TEXT NOT NULL,
      cv                BLOB NOT NULL,
      cv_name           TEXT NOT NULL,
      cv_size           INTEGER NOT NULL,
      delivered_at      INTEGER,
      delivery_error    TEXT
    );

    CREATE INDEX IF NOT EXISTS applications_email ON applications (email);
  `)

  // Columnas agregadas después: CREATE TABLE IF NOT EXISTS no las añade solo.
  const columnas = new Set(
    (db.prepare('PRAGMA table_info(applications)').all() as Array<{
      name: string
    }>).map((c) => c.name),
  )
  for (const [nombre, tipo] of [
    ['replay_url', 'TEXT'],
    ['activity', 'TEXT'],
    ['answer_case', "TEXT NOT NULL DEFAULT ''"],
    ['answer_ask', "TEXT NOT NULL DEFAULT ''"],
  ]) {
    if (!columnas.has(nombre)) {
      db.exec(`ALTER TABLE applications ADD COLUMN ${nombre} ${tipo}`)
    }
  }

  return db
}

/** Para los tests, que cambian de carpeta entre casos. */
export function closeDb() {
  db?.close()
  db = null
}
