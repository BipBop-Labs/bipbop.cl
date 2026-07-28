import { vi } from 'vitest'

/**
 * Un Discord de mentira que hace respetar los límites de verdad del webhook.
 *
 * Solo lo usan los tests. Existe porque el mock anterior contestaba 200 a todo,
 * así que los tests pasaban en verde mientras producción rechazaba mensajes de
 * más de 2.000 caracteres y la gente no podía postular. Un doble que dice que
 * sí a todo no prueba nada: lo que hay que probar es que el otro lado acepte.
 *
 * Límites según la documentación de Discord.
 */

export const CONTENT_LIMIT = 2000
export const ATTACHMENT_LIMIT = 8 * 1024 * 1024

export type SentMessage = {
  content: string
  files: Array<{ name: string; size: number; type: string }>
}

type Options = {
  /** Cuántas de las primeras peticiones responden 429. */
  rateLimitFirst?: number
  /** Cae con este estado en vez de aceptar. */
  failWith?: number
}

export function fakeDiscord(options: Options = {}) {
  const sent: Array<SentMessage> = []
  let calls = 0

  const reject = (status: number, message: string) =>
    new Response(JSON.stringify({ message, code: 50035 }), { status })

  const mock = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (_input, init) => {
      calls += 1

      if (options.rateLimitFirst && calls <= options.rateLimitFirst) {
        return Response.json({ retry_after: 0.01 }, { status: 429 })
      }
      if (options.failWith) {
        return reject(options.failWith, 'algo salió mal')
      }

      const body = init?.body
      if (!(body instanceof FormData)) {
        return reject(400, 'esperaba multipart/form-data')
      }

      const payload = body.get('payload_json')
      if (typeof payload !== 'string') {
        return reject(400, 'falta payload_json')
      }
      const { content } = JSON.parse(payload) as { content?: string }

      // Esto es lo que rompió en producción.
      if ((content?.length ?? 0) > CONTENT_LIMIT) {
        return reject(
          400,
          `Invalid Form Body: content: Must be ${CONTENT_LIMIT} or fewer in length.`,
        )
      }

      const files: SentMessage['files'] = []
      for (const [key, value] of body.entries()) {
        if (!key.startsWith('files[') || !(value instanceof File)) continue
        if (value.size > ATTACHMENT_LIMIT) {
          return reject(413, 'Request entity too large')
        }
        files.push({ name: value.name, size: value.size, type: value.type })
      }

      if (!content && files.length === 0) {
        return reject(400, 'un mensaje vacío no se puede enviar')
      }

      sent.push({ content: content ?? '', files })
      return Response.json({
        id: `msg-${sent.length}`,
        attachments: files.map((f, i) => ({
          id: String(i),
          url: `https://cdn.discord.test/${f.name}`,
        })),
      })
    })

  return {
    mock,
    sent,
    /** Todo el texto que llegó, en orden: sirve para ver que nada se perdió. */
    text: () => sent.map((m) => m.content).join('\n'),
    files: () => sent.flatMap((m) => m.files),
  }
}
