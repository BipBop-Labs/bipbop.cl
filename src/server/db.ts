import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

/**
 * SQLite, con el módulo que ya trae Node: sin dependencias ni un contenedor
 * aparte. Guarda solo dos cosas, las que duelen si se pierden al redesplegar:
 * las sesiones de la terminal a medio llenar, y qué correos ya postularon.
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

    -- Solo el hash del correo: alcanza para deduplicar y no guarda a nadie.
    CREATE TABLE IF NOT EXISTS applied (
      email_hash  TEXT PRIMARY KEY,
      created_at  INTEGER NOT NULL
    );
  `)

  return db
}

/** Para los tests, que cambian de carpeta entre casos. */
export function closeDb() {
  db?.close()
  db = null
}
