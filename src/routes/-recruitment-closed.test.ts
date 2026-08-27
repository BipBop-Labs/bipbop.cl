import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Route as ApplicationsRoute } from './api.applications'
import { Route as ShellRoute } from './api.shell'
import { Route as PostularRoute } from './postular'

const applicationHandlers = ApplicationsRoute.options.server!.handlers as unknown as {
  GET: () => Response
  POST: (ctx: { request: Request }) => Promise<Response> | Response
}

const shellHandlers = ShellRoute.options.server!.handlers as unknown as {
  POST: (ctx: { request: Request }) => Promise<Response> | Response
}

describe('closed recruitment', () => {
  it('tells people the role is closed on /postular without showing an application form', () => {
    const Component = PostularRoute.options.component!
    const html = renderToStaticMarkup(createElement(Component))

    expect(html).toContain('Ya no estamos recibiendo postulaciones')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('elegir PDF')
  })

  it('advertises the closed state to agents', async () => {
    const response = applicationHandlers.GET()

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({
      ok: false,
      hiring: false,
      message: 'Ya no estamos recibiendo postulaciones.',
    })
  })

  it('rejects direct application submissions before reading their contents', async () => {
    const body = new FormData()
    body.append('fullName', 'Ada Lovelace')

    const response = await applicationHandlers.POST({
      request: new Request('http://localhost/api/applications', {
        method: 'POST',
        body,
      }),
    })

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({
      ok: false,
      hiring: false,
      message: 'Ya no estamos recibiendo postulaciones.',
    })
  })

  it('rejects terminal requests while recruitment is closed', async () => {
    const response = await shellHandlers.POST({
      request: new Request('http://localhost/api/shell', {
        method: 'POST',
        body: new FormData(),
      }),
    })

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({
      error: 'Ya no estamos recibiendo postulaciones.',
    })
  })
})
