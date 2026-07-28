# bipbop.cl

Site for **BipBop Labs**, a small software studio in Santiago, Chile. Built with
[TanStack Start](https://tanstack.com/start) (React + Vite + Nitro) and Tailwind
CSS v4, so the site ships with a server it can grow into.

**Pages**

- `/` — studio landing page
- `/revi` — Revi CChC, an AI assistant for building permits in Chile (product page)
- `/postular` — Software Engineer job application form
- `/styleguide` — browsable brand style guide
- `/api/health` — server liveness check
- `/api/applications` — `POST`, receives the job application

## Running it

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

```sh
pnpm build        # vite + nitro → .output/
pnpm start        # node .output/server/index.mjs
pnpm check        # tsc --noEmit
pnpm test         # vitest run
```

Copy `.env.example` to `.env` before running the application form locally.

## Layout

```
src/routes/            file-based routes; one file per page
src/routes/__root.tsx  the HTML shell: fonts, favicon, PostHog, language provider
src/components/        shared pieces (the wordmark SVG)
src/data/schema.ts     JSON-LD structured data, one graph per page
src/lib/lang.tsx       ES/EN language context behind the header toggle
src/styles.css         Tailwind theme tokens + the handful of rules utilities can't express
public/                served as-is: brand assets, robots.txt, sitemap.xml, llms.txt
scripts/               asset generation
STYLE.md               brand reference in text form
```

## Job applications

`/postular` posts to `/api/applications`. The same validation module runs on
both sides (`src/lib/application.ts`), so the client and the server can never
disagree about what a valid application is.

**Discord is the source of truth.** The server stores nothing: the request is
screened for abuse, the CV is validated inside a temporary folder and uploaded
to the team's webhook, and the message itself carries the whole application —
fields, an id, a timestamp and `status: new`. The temp folder is deleted either
way, so the PDF never stays on disk. If Discord is down nothing is recorded and
the candidate can simply retry.

Spam and duplicate protection (honeypot, fill time, per-IP rate limit, one
application per email per 24 h) lives in memory, so it resets on restart. That's
deliberate — it's a brake, not a record.

See `src/server/applications.ts` for the screening and validation rules.

The only configuration is `DISCORD_WEBHOOK_URL`; see `.env.example`.

## Adding a backend

Routes can export server handlers, and `createServerFn` gives you server-side
functions callable straight from components:

```tsx
// src/routes/api.thing.ts
export const Route = createFileRoute('/api/thing')({
  server: { handlers: { GET: () => json({ ok: true }) } },
})
```

## Deploying

The build is a self-contained Node server. A `Dockerfile` is included and the
image listens on `PORT` (default 3000):

```sh
docker build -t bipbop .
docker run -p 3000:3000 bipbop
```

On **Coolify**: create an Application from this repo, pick the *Dockerfile*
build pack, set the port to `3000`, and point the health check at `/api/health`.
The only environment variable is `DISCORD_WEBHOOK_URL`; no volumes needed.

## Brand assets

Two vector sources are the single source of truth:

- `public/brand/head.svg` — the penguin head mark, **the** logo
- `public/brand/body.svg` — full-body penguin, deprecated as a logo (landing hero only)

Everything under `public/brand/generated/` is script output — **never edit
generated files by hand**. To regenerate after touching a source or the palette:

```sh
python3 scripts/generate-brand.py
```

Requires `rsvg-convert` and ImageMagick (`magick`) on PATH, plus the Instrument
Serif and JetBrains Mono fonts installed. Palettes live at the top of the
script; try alternates with `--palette <name>`.

Full brand rules (colors, typography, mark usage) are in [STYLE.md](STYLE.md).

## Editing notes

- Design tokens live in the `@theme` block of `src/styles.css`; use the Tailwind
  utilities they generate (`text-ink-2`, `border-line`, `bg-success-soft`) rather
  than raw hex.
- Copy is bilingual. Each route pulls `useT()` from `src/lib/lang.tsx` and calls
  `t('español', 'english')`; Spanish renders on the server, since that's the
  audience and what crawlers see.
- Keep SEO surfaces in sync when content changes: the route's `head()`, the
  JSON-LD in `src/data/schema.ts`, `public/llms.txt`, and `public/sitemap.xml`.

## Contact

Juan Vargas · juan@bipbop.cl
