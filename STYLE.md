# BipBop Labs — Brand Style Reference

Everything known about the brand in one place. For the visual, browsable
version see [`styleguide.html`](styleguide.html).

- **Name:** BipBop Labs (set as `BipBop Labs_` — "Bop" and the trailing
  underscore in moss green)
- **Tagline:** *Software hecho con cariño, pensado contigo y construido a tu lado.*
- **Domain:** bipbop.cl · **Location:** Santiago, CL

## Marks

Two vector sources are the single source of truth. Everything under
`brand/generated/` is built from them — never edit generated files by hand.

```
brand/
├── head.svg          ← source: penguin head mark
├── body.svg          ← source: full-body penguin mark
├── machine.webp      (photo, not generated)
├── skyline.webp      (photo, not generated)
├── projects/         (project art, not generated)
└── generated/        ← everything below is script output
    ├── og.{svg,png}  favicon.{svg,ico}  wordmark.{svg,png}  bipbop_logo.webp
    ├── social/       linkedin-banner, linkedin-avatar, github-avatar
    └── stickers/     01-logo … 05-url (svg + png + print variants)
```

| Mark | Source | What it is | Where it's used |
|---|---|---|---|
| **Head** | `brand/head.svg` | Penguin head on a square 512×512 canvas | Icon sticker, favicon, avatars, OG image, wordmark lockups, site header |
| **Body** | `brand/body.svg` | Full-body penguin holding blocks (624×1024) | Logo sticker, stacked lockups, LinkedIn banner, site hero background |
| **Wordmark** | text in `scripts/generate-brand.py` templates | `BipBop Labs_` in Instrument Serif | Everywhere text appears next to a mark |

Both marks are single-color traces (`fill` is set per-asset from the palette).
The head's square canvas (`viewBox="-7 0 512 512"`) centers the 498-unit-wide
artwork; keep it square so avatars and favicons don't need per-platform
adjustment.

## Color

Site-wide scale (defined in `index.html` CSS custom properties):

| Token | Hex | Role |
|---|---|---|
| cream-50 | `#faf9f5` | raised surfaces |
| cream-100 | `#f7f5f0` | **background** |
| cream-200 | `#ede9e0` | subtle background |
| cream-300 | `#ddd7c8` | borders, rules |
| cream-400 | `#a39d92` | tertiary text, strong borders |
| cream-600 | `#6b6862` | secondary text |
| cream-900 | `#161513` | **ink** — primary text and the marks |
| moss-500 | `#3d7a3a` | **signal** — the brand accent (links, "Bop", underscore) |
| moss-600 | `#2f5f2d` | accent hover |
| moss-100 | `#e3ebd9` | accent subtle background |
| clay-500 | `#b54836` | destructive/error accent |
| clay-600 | `#8f3829` | error hover |
| clay-100 | `#f2dcd4` | error subtle background |

The generator's default palette (`cream-moss` in `scripts/generate-brand.py`)
uses: bg `#f7f5f0`, text `#161513`, secondary `#6b6862`, tertiary `#a39d92`,
line `#ddd7c8`, signal `#3d7a3a`.

### On dark backgrounds

Never photo-negative invert. Dark variants are a **knockout**:

- Ink becomes cream `#f4f1ec` (not pure white)
- Signal lifts to `#5cab52` so the accent keeps contrast on a dark field
- Strokes are optically thinned (`feMorphology` erode, radius 0.55) to counter
  the irradiation illusion of light-on-dark line art

## Typography

| Face | Role | Notes |
|---|---|---|
| **Instrument Serif** | Display / wordmark / headings | Has no bold weight — faux-bold via `stroke` at ~1/50 of font-size (`stroke-width="2.8"` at 148px), `paint-order="stroke fill"`. Fallback: Times New Roman. |
| **JetBrains Mono** | Labels, kickers, code | Uppercase with wide letter-spacing (~5px at 20px) for kicker labels like `SANTIAGO · CL`. Fallbacks: SF Mono, Consolas. |

## Asset inventory

**Sources (hand-edited):** `brand/head.svg`, `brand/body.svg`, plus the photos
`brand/machine.webp`, `brand/skyline.webp` and `brand/projects/*` (not brand
marks, not generated).

**Generated** — rebuild with `python3 scripts/generate-brand.py [--palette name]`
(needs `rsvg-convert`, `magick`, and both fonts installed):

| Asset | Files | Notes |
|---|---|---|
| Logo sticker | `brand/generated/stickers/01-logo.{svg,png}` | Body mark, ink on transparent |
| Wordmark sticker | `brand/generated/stickers/02-wordmark.{svg,png}` | Head + `BipBop Labs_`, icon height = 5/3 × cap-height of B |
| Icon sticker | `brand/generated/stickers/03-icon.{svg,png}` | Head mark, square |
| Stacked lockups | `brand/generated/stickers/04-lockup-{dark,light}.{svg,png}` + `-on-black/-on-white.png` | Body over wordmark; dark is the knockout variant |
| URL lockups | `brand/generated/stickers/05-url-{dark,light}.{svg,png}` + on-bg PNGs | Head + `bipbop.cl`; text is pre-outlined so print shops never need the font |
| Wordmark | `brand/generated/wordmark.{svg,png}` | Text-only `BipBop Labs_` |
| OG image | `brand/generated/og.{svg,png}` | 1200×630 |
| Favicon | `brand/generated/favicon.{svg,ico}` | Rounded cream tile, head near full-bleed, moss dash; ICO packs 64/48/32/16, with strokes bolded at 32 (+80) and 16 (+140 path units) so lines survive tab scale |
| LinkedIn banner | `brand/generated/social/linkedin-banner.{svg,png}` | 1584×396 |
| LinkedIn avatar | `brand/generated/social/linkedin-avatar.{svg,png}` | 400×400 |
| GitHub avatar | `brand/generated/social/github-avatar.{svg,png}` | 460×460 |
| Site hero raster | `brand/generated/bipbop_logo.webp` | Body mark; referenced by `index.html` CSS |

## Motifs

- Radial moss glow from the top-right corner (16% opacity) and bottom-left
  (6%) on filled backgrounds (OG, banner, avatars, favicon)
- Short moss dash/rule as a signature accent (avatars, favicon)
- Kicker rows separated by a 1px cream-300 rule (OG footer)
