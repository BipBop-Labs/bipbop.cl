# bipbop.cl

Site for **BipBop Labs**, a small software studio in Santiago, Chile. Built with
[TanStack Start](https://tanstack.com/start) (React + Vite + Nitro) and Tailwind
CSS v4, so the site ships with a server it can grow into.

**Pages**

- `/` — studio landing page
- `/revi` — Revi CChC, an AI assistant for building permits in Chile (product page)
- `/postular` — Software Engineer application, as a terminal
- `/styleguide` — browsable brand style guide
- `/api/health` — server liveness check
- `/api/applications` — the documented path for agents (`GET` returns the contract)
- `/api/shell` — backend for the `/postular` terminal

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

Copy `.env.example` to `.env` before running the application flow locally.

## Layout

```
src/routes/            file-based routes; one file per page
src/routes/__root.tsx  the HTML shell: fonts, favicon, PostHog, language provider
src/components/        shared pieces (the wordmark SVG)
src/data/schema.ts     JSON-LD structured data, one graph per page
src/lib/lang.tsx       ES/EN language context behind the header toggle
src/server/            server-only code: the terminal, delivery, SQLite
src/styles.css         Tailwind theme tokens + the handful of rules utilities can't express
public/                served as-is: brand assets, robots.txt, sitemap.xml, llms.txt
scripts/               asset generation
STYLE.md               brand reference in text form
```

## Job applications

`/postular` is a terminal. You `ls`, you `cat README.md`, and you run
`./postular` to apply. It doubles as a filter: someone who can't find their way
around a shell is not who we're hiring.

**The shell runs server-side** (`src/server/shell.ts`). The browser only sends
what was typed and paints the lines it gets back, so the commands, the files,
the question order and the hidden flag never ship in the client bundle. The one
concession to the metaphor is the CV: drag it onto the window, or press Enter
to open a file picker.

Two ways in, and we tag which one was used:

- **the terminal**, for people
- **`POST /api/applications`**, for agents. `GET` on the same path returns the
  contract as JSON. It's advertised to machines (an `ai-agent-endpoint` meta
  tag, and `public/llms.txt`) but not shown on the page. Applying through it
  counts in your favour, and Discord shows which route each one took.

There's a flag hidden in the terminal. Finding it and passing it with
`./postular --flag <value>` marks the application in Discord. It changes
nothing formally; it's just signal.

**Discord is the source of truth for applications.** The CV is validated inside
a temporary folder and uploaded to the team's webhook, and the message itself
carries the whole application: fields, an id, a timestamp and `status: new`.
The temp folder is deleted either way, so the PDF never stays on disk. If
Discord is down nothing is recorded and the candidate can simply retry.

**SQLite holds what hurts to lose on a deploy** (`src/server/db.ts`, via Node's
built-in `node:sqlite`, no dependency and no extra container): half-finished
terminal sessions, so a redeploy doesn't wipe what someone was typing, and the
hash of each email that already applied, so the 24 h duplicate check survives a
restart. It stores the hash, never the address. It lives in `$DATA_DIR`, mounted
as a volume.

Rate limits stay in memory and are deliberately **not** keyed on IP alone. A
residential IP or a CGNAT can hide a whole neighbourhood, so the IP is only a
ceiling against scripts: terminal traffic is counted per session, applications
are counted per IP but only when one actually goes out (a rejected format costs
nothing), and the real limit on applying twice is the per-email check above.

See `src/server/applications.ts` for the screening and validation rules.

Configuration is `DISCORD_WEBHOOK_URL` and `DATA_DIR`; see `.env.example`.

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
Set `DISCORD_WEBHOOK_URL`, and mount a persistent volume at `/data` so the
SQLite file survives redeploys. The container publishes no ports of its own;
the proxy reaches it over the internal network.

## Brand assets

Two vector sources are the single source of truth:

- `public/brand/head.svg` — the penguin head mark, **the** logo
- `public/brand/body.svg` — full-body penguin, deprecated as a logo (landing hero only)

`public/brand/og.png` is the social preview card. It is hand-made, not script
output, and it is not the same file as `public/brand/generated/og.png`.

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
