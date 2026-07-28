/**
 * Verificación del CV antes de mandarlo a ninguna parte: que sea un PDF de
 * verdad y no traiga contenido activo. No reescribimos el archivo — lo
 * aceptamos o lo rechazamos.
 */

import { MAX_CV_BYTES } from '#/lib/application'

/** Marcadores de contenido activo: un CV no los necesita. */
const ACTIVE_CONTENT = [
  '/JavaScript',
  '/Launch',
  '/EmbeddedFile',
  '/OpenAction',
]

export function inspectPdf(bytes: Uint8Array): string | undefined {
  if (bytes.byteLength === 0) return 'El archivo está vacío.'
  if (bytes.byteLength > MAX_CV_BYTES)
    return 'El PDF no puede superar los 10 MB.'

  const head = Buffer.from(bytes.subarray(0, 5)).toString('latin1')
  if (head !== '%PDF-') return 'El archivo no es un PDF válido.'

  // El marcador de fin va al final; si falta, el PDF está truncado.
  const tail = Buffer.from(
    bytes.subarray(Math.max(0, bytes.byteLength - 2048)),
  ).toString('latin1')
  if (!tail.includes('%%EOF')) return 'El PDF parece estar incompleto.'

  const text = Buffer.from(bytes).toString('latin1')
  if (ACTIVE_CONTENT.some((marker) => text.includes(marker))) {
    return 'El PDF contiene contenido activo (scripts o archivos adjuntos). Exporta una versión simple e inténtalo de nuevo.'
  }

  return undefined
}

/** Nombre de archivo seguro para el adjunto: nunca el que subió el usuario. */
export function safeCvName(fullName: string): string {
  const slug = fullName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60)
  return `cv-${slug || 'postulante'}.pdf`
}
