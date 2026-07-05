# bipbop.cl

Static site for **BipBop Labs**, a small software studio in Santiago, Chile. No build step, no framework — plain HTML/CSS served as-is.

**Live pages**

- [bipbop.cl](https://bipbop.cl) — studio landing page
- [bipbop.cl/revi](https://bipbop.cl/revi/) — Revi CChC, an AI assistant for building permits in Chile (product page)
- [styleguide.html](styleguide.html) — browsable brand style guide

## Layout

```
index.html          landing page
revi/index.html     Revi CChC product page
styleguide.html     visual brand reference
STYLE.md            brand reference in text form
llms.txt            plain-text summary for LLM crawlers
robots.txt          crawler rules
sitemap.xml         sitemap
brand/              brand assets (see below)
scripts/            asset generation
```

## Brand assets

Two vector sources are the single source of truth:

- `brand/head.svg` — the penguin head mark, **the** logo
- `brand/body.svg` — full-body penguin, deprecated as a logo (landing hero only)

Everything under `brand/generated/` (favicon, OG image, wordmark, stickers, social avatars/banners) is script output — **never edit generated files by hand**. To regenerate after touching a source or the palette:

```sh
python3 scripts/generate-brand.py
```

Requires `rsvg-convert` and ImageMagick (`magick`) on PATH, plus the Instrument Serif and JetBrains Mono fonts installed. Palettes live at the top of the script; try alternates with `--palette <name>`.

Full brand rules (colors, typography, mark usage) are in [STYLE.md](STYLE.md).

## Editing notes

- Both pages are self-contained HTML files with inline CSS — edit them directly.
- Keep SEO surfaces in sync when content changes: page `<head>` metadata, FAQ/JSON-LD schema in `revi/index.html`, `llms.txt`, and `sitemap.xml`.
- Site copy is in Spanish; that's the audience.

## Contact

Juan Vargas · juan@bipbop.cl
