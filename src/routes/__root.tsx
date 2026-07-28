import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import appCss from '#/styles.css?url'
import { LangProvider } from '#/lib/lang'
import { startAnalytics } from '#/lib/analytics'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'author', content: 'Juan Vargas' },
      { name: 'theme-color', content: '#f7f5f0' },
      {
        name: 'robots',
        content: 'index,follow,max-image-preview:large,max-snippet:-1',
      },
      { property: 'og:site_name', content: 'BipBop Labs' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/x-icon', href: '/brand/generated/favicon.ico' },
      {
        rel: 'apple-touch-icon',
        href: '/brand/generated/social/github-avatar.png',
      },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startAnalytics()
    console.log(
      '%c  ___ _      ___\n | _ |_)_ __| _ )___ _ __\n | _ \\ | \\' +
        "'" +
        '_ \\ _ \\/ _ \\ \\' +
        "'" +
        '_ \\\n |___/_| .__/___/\\___/ .__/\n       |_|           |_|\n',
      'color:#6cf09a;font-family:monospace;font-size:11px;line-height:1.2;',
    )
    console.log(
      '%cHola. ' +
        "%cIf you're reading this, you probably like the details.\nWe do too. juan@bipbop.cl",
      'color:#6cf09a;font-weight:600;',
      'color:inherit;',
    )
  }, [])

  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        <LangProvider>{children}</LangProvider>
        <Scripts />
      </body>
    </html>
  )
}
