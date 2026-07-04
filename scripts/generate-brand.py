#!/usr/bin/env python3
"""
Regenerate EVERY brand asset from the two vector sources + one palette:

    brand/head.svg   — penguin head mark (square), used for icon/favicon/avatars
    brand/body.svg   — full-body penguin mark, used for logo/lockups
    (the wordmark text "BipBop Labs_" lives in the templates below)

Everything the script writes lands under brand/generated/ (stickers 01–05
incl. on-black/on-white prints, wordmark, OG image, LinkedIn banner/avatar,
GitHub avatar, favicon svg+ico, and the site's bipbop_logo.webp) — the brand/
top level holds only the sources.

Tweak PALETTE below (or pass --palette name) and re-run:
    python3 scripts/generate-brand.py

Requires `rsvg-convert` and `magick` on PATH, plus the Instrument Serif and
JetBrains Mono fonts installed (live <text> in the SVGs rasterizes with them).
"""

from __future__ import annotations

import argparse
import base64
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
GEN = BRAND / "generated"
SOCIAL = GEN / "social"
STICKERS = GEN / "stickers"

HEAD_SRC = BRAND / "head.svg"
BODY_SRC = BRAND / "body.svg"

# --- Palettes -----------------------------------------------------------------
# Add new entries to experiment. Keys must match the placeholders in templates.

PALETTES: dict[str, dict[str, str]] = {
    "cream-moss": {
        "bg":        "#f7f5f0",  # cream-100
        "text":      "#161513",  # cream-900
        "secondary": "#6b6862",  # cream-600
        "tertiary":  "#a39d92",  # cream-400
        "line":      "#ddd7c8",  # cream-300
        "signal":    "#3d7a3a",  # moss-500
        # on-dark (knockout) variants: cream ink instead of a raw invert, and a
        # lifted moss so the accent keeps contrast against a dark field
        "ink_on_dark":    "#f4f1ec",
        "signal_on_dark": "#5cab52",
    },
    # example alternates — feel free to edit
    "slate-amber": {
        "bg":        "#f4f1ec",
        "text":      "#1b1d22",
        "secondary": "#5a5f6a",
        "tertiary":  "#9aa0aa",
        "line":      "#d8dae0",
        "signal":    "#c47a1a",
        "ink_on_dark":    "#f4f1ec",
        "signal_on_dark": "#e0a54a",
    },
    "ink-pine": {
        "bg":        "#f6f4ef",
        "text":      "#10221a",
        "secondary": "#4f5d56",
        "tertiary":  "#94a39b",
        "line":      "#d4dcd6",
        "signal":    "#0e6b3c",
        "ink_on_dark":    "#f4f1ec",
        "signal_on_dark": "#3fa46e",
    },
}

# --- Source + render helpers ----------------------------------------------------


def vector_paths(src: Path) -> str:
    """Extract the bare <path .../> elements from a source SVG."""
    paths = re.findall(r"<path d=\"[^\"]*\"/>", src.read_text())
    if not paths:
        raise SystemExit(f"no <path> elements found in {src.relative_to(ROOT)}")
    return "\n".join(f"      {p}" for p in paths)


def rsvg(svg_file: Path, out: Path, w: int | None = None, h: int | None = None,
         bg: str | None = None) -> None:
    args = ["rsvg-convert"]
    if w:
        args += ["-w", str(w)]
    if h:
        args += ["-h", str(h)]
    if bg:
        args += ["-b", bg]
    args += [str(svg_file), "-o", str(out)]
    subprocess.run(args, check=True)


def render_data_uri(src: Path, w: int | None, h: int | None) -> str:
    """Rasterize a source SVG and return it as a PNG data URI (for <image> embeds)."""
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "embed.png"
        rsvg(src, png, w=w, h=h)
        b64 = base64.b64encode(png.read_bytes()).decode()
    return f"data:image/png;base64,{b64}"


def emit(svg_rel: Path, svg_text: str,
         rasters: list[tuple[Path, dict]] | None = None) -> None:
    """Write an SVG and raster it to each (png path, rsvg kwargs)."""
    svg_rel.write_text(svg_text)
    wrote = [str(svg_rel.relative_to(ROOT))]
    for png_path, kwargs in rasters or []:
        rsvg(svg_rel, png_path, **kwargs)
        wrote.append(str(png_path.relative_to(ROOT)))
    print("wrote " + " + ".join(wrote))


# --- Sticker templates ----------------------------------------------------------
# The head paths live in a 4980x5120 space (translate/scale flips trace coords);
# the body paths in a 6240x10240 space. Compositions keep those wrappers.

ICON_STICKER_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 0 512 512">
  <title>BipBop Labs — Icon Sticker</title>
  <g transform="translate(0,512) scale(0.1,-0.1)" fill="{text}">
{head_paths}
  </g>
</svg>
"""

LOGO_STICKER_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 624 1024">
  <title>BipBop Labs — Logo</title>
  <g transform="translate(0,1024) scale(0.1,-0.1)" fill="{text}">
{body_paths}
  </g>
</svg>
"""

WORDMARK_STICKER_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 195" font-family="'Instrument Serif', 'Times New Roman', serif">
  <title>BipBop Labs — Wordmark Sticker</title>

  <!-- Icon: height = 5/3 * cap-height of B, centered vertically on B + cap/3 above and below -->
  <g transform="translate(0,5.92) scale(0.34688)">
    <g transform="translate(0,512) scale(0.1,-0.1)" fill="{text}">
{head_paths}
    </g>
  </g>

  <!-- Faux-bold via stroke (Instrument Serif has no Bold weight; matches the landing's synthesized bold) -->
  <text x="209" y="148" font-size="148" fill="{text}" stroke="{text}" stroke-width="2.8" paint-order="stroke fill">Bip<tspan fill="{signal}" stroke="{signal}">Bop</tspan> Labs<tspan fill="{signal}" stroke="{signal}">_</tspan></text>
</svg>
"""

# Text-only wordmark (the "text logo" without the head).
WORDMARK_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 195" font-family="'Instrument Serif', 'Times New Roman', serif">
  <title>BipBop Labs — Wordmark</title>
  <text x="9" y="148" font-size="148" fill="{text}" stroke="{text}" stroke-width="2.8" paint-order="stroke fill">Bip<tspan fill="{signal}" stroke="{signal}">Bop</tspan> Labs<tspan fill="{signal}" stroke="{signal}">_</tspan></text>
</svg>
"""

# Stacked lockup: penguin on top, wordmark below. The dark variant is a proper
# knockout (cream ink + lifted accent + optically thinned strokes to counter the
# irradiation illusion), NOT a photo-negative invert. The penguin is the raster
# logo recolored via an SVG filter (flood the ink color through its alpha, then
# erode to thin the lines); the wordmark is live text so it stays crisp.
LOCKUP_DARK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 728 940" role="img" aria-label="BipBop Labs">
  <title>BipBop Labs — stacked lockup (on dark)</title>
  <defs>
    <filter id="knockout" x="-6%" y="-6%" width="112%" height="112%">
      <feMorphology in="SourceAlpha" operator="erode" radius="0.55" result="thin"/>
      <feFlood flood-color="{ink_on_dark}"/>
      <feComposite in2="thin" operator="in"/>
    </filter>
  </defs>

  <image href="{logo_href}" x="164" y="30" width="400" height="657"
         preserveAspectRatio="xMidYMid meet" filter="url(#knockout)"/>

  <text x="364" y="876" text-anchor="middle"
        font-family="'Instrument Serif', 'Times New Roman', serif"
        font-size="150" fill="{ink_on_dark}" stroke="{ink_on_dark}" stroke-width="1.6"
        paint-order="stroke fill"
    >Bip<tspan fill="{signal_on_dark}" stroke="{signal_on_dark}">Bop</tspan> Labs<tspan fill="{signal_on_dark}" stroke="{signal_on_dark}">_</tspan></text>
</svg>
"""

# Light variant of the same stacked lockup, for parity (dark ink on transparent).
LOCKUP_LIGHT_SVG = """<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 728 940" role="img" aria-label="BipBop Labs">
  <title>BipBop Labs — stacked lockup (on light)</title>
  <defs>
    <filter id="ink" x="-6%" y="-6%" width="112%" height="112%">
      <feFlood flood-color="{text}"/>
      <feComposite in2="SourceAlpha" operator="in"/>
    </filter>
  </defs>

  <image href="{logo_href}" x="164" y="30" width="400" height="657"
         preserveAspectRatio="xMidYMid meet" filter="url(#ink)"/>

  <text x="364" y="876" text-anchor="middle"
        font-family="'Instrument Serif', 'Times New Roman', serif"
        font-size="150" fill="{text}" stroke="{text}" stroke-width="2.8"
        paint-order="stroke fill"
    >Bip<tspan fill="{signal}" stroke="{signal}">Bop</tspan> Labs<tspan fill="{signal}" stroke="{signal}">_</tspan></text>
</svg>
"""

# URL lockup: head + "bipbop.cl". The text is pre-outlined Instrument Serif
# (faux-bold stroke baked into the paths) so print shops never need the font.
# {thin_defs}/{thin_attr} inject the optical erode on the dark variant only.
URL_STICKER_SVG = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 728 620">
  <title>bipbop.cl — icon lockup ({variant})</title>{thin_defs}
  <g fill="{ink}"{thin_attr} transform="translate(204,40) scale(0.642570)">
    <g transform="translate(0,512) scale(0.1,-0.1)">
{head_paths}
    </g>
  </g>
  <g style="fill:{ink};stroke:{ink};stroke-width:1.4;paint-order:stroke fill" aria-label="bipbop.cl">
    <path d="m 186.09487,521.17 q -5.33,0 -10.27,-3.38 -2.86,-1.95 -5.2,1.04 -1.3,1.43 -1.95,1.82 -0.65,0.52 -1.3,0.52 -1.43,0 -1.04,-1.82 0.52,-2.99 0.78,-7.67 0.26,-4.68 0.26,-12.48 v -62.4 q 0,-2.34 -0.78,-3.12 -0.65,-0.91 -2.47,-1.17 l -2.73,-0.39 q -1.43,-0.26 -1.43,-1.56 0,-1.3 1.43,-1.56 3.64,-0.78 6.11,-1.82 2.47,-1.04 4.16,-2.08 2.08,-1.3 3.12,-1.3 1.43,0 1.43,2.08 v 32.11 q 0,1.04 0.78,1.43 0.91,0.26 1.95,-0.78 5.59,-5.72 12.22,-5.72 5.98,0 10.53,4.03 4.68,3.9 7.28,10.92 2.73,7.02 2.73,16.51 0,10.79 -3.38,19.11 -3.38,8.32 -9.23,13 -5.72,4.68 -13,4.68 z m -0.26,-3.25 q 7.28,0 11.7,-8.58 4.55,-8.58 4.55,-23.14 0,-13.39 -3.9,-20.41 -3.9,-7.02 -11.05,-7.02 -4.42,0 -7.67,3.64 -3.25,3.64 -3.25,10.14 v 32.76 q 0,5.85 2.6,9.23 2.73,3.38 7.02,3.38 z m 45.8901,-76.57 q -2.73,0 -4.68,-1.95 -1.82,-1.95 -1.82,-4.94 0,-2.99 1.82,-4.81 1.95,-1.95 4.68,-1.95 2.73,0 4.55,1.95 1.82,1.82 1.82,4.81 0,2.99 -1.82,4.94 -1.82,1.95 -4.55,1.95 z m -10.92,78.65 q -1.95,0 -1.95,-1.43 0,-1.17 1.69,-1.56 l 1.56,-0.26 q 3.25,-0.52 4.16,-1.56 0.91,-1.17 0.91,-3.9 v -43.68 q 0,-2.34 -0.78,-3.12 -0.65,-0.91 -2.47,-1.17 l -2.73,-0.39 q -1.69,-0.13 -1.69,-1.43 0,-1.04 2.08,-1.43 4.03,-0.65 6.5,-2.08 2.47,-1.43 4.81,-3.51 1.17,-1.17 1.95,-1.17 1.17,0 1.17,1.56 v 56.42 q 0,2.73 0.78,3.9 0.78,1.17 2.99,1.43 l 3.25,0.39 q 1.43,0.26 1.43,1.43 0,1.56 -1.95,1.56 z m 28.59994,26.65 q -1.95,0 -1.95,-1.43 0,-1.43 1.69,-1.56 l 1.82,-0.26 q 2.73,-0.39 3.51,-1.56 0.91,-1.17 0.91,-3.9 v -70.33 q 0,-2.34 -0.78,-3.12 -0.65,-0.91 -2.47,-1.17 l -2.73,-0.39 q -1.69,-0.13 -1.69,-1.43 0,-1.04 2.08,-1.43 4.03,-0.65 6.11,-2.08 2.21,-1.43 4.55,-3.51 1.17,-1.17 1.95,-1.17 1.17,0 1.17,1.56 v 4.03 q 0,0.91 0.78,1.3 0.78,0.26 1.82,-0.78 l 1.43,-1.43 q 2.6,-2.6 5.33,-3.77 2.73,-1.3 6.24,-1.3 5.98,0 10.53,4.03 4.68,3.9 7.28,10.92 2.73,7.02 2.73,16.51 0,10.79 -3.38,19.11 -3.38,8.32 -9.36,13 -5.85,4.68 -13.52,4.68 -3.9,0 -6.89,-1.43 -2.34,-1.04 -2.34,1.43 v 16.77 q 0,2.73 0.78,3.64 0.91,1.04 3.64,1.43 l 4.81,0.65 q 1.43,0.26 1.43,1.43 0,1.56 -1.95,1.56 z m 24.44,-28.73 q 7.28,0 11.7,-8.58 4.55,-8.58 4.55,-23.14 0,-13.39 -3.9,-20.41 -3.9,-7.02 -11.05,-7.02 -4.42,0 -7.67,3.64 -3.25,3.64 -3.25,10.14 v 32.76 q 0,5.85 2.6,9.23 2.73,3.38 7.02,3.38 z"/>
    <path style="fill:{accent};stroke:{accent}" d="m 330.39494,521.17 q -5.33,0 -10.27,-3.38 -2.86,-1.95 -5.2,1.04 -1.3,1.43 -1.95,1.82 -0.65,0.52 -1.3,0.52 -1.43,0 -1.04,-1.82 0.52,-2.99 0.78,-7.67 0.26,-4.68 0.26,-12.48 v -62.4 q 0,-2.34 -0.78,-3.12 -0.65,-0.91 -2.47,-1.17 l -2.73,-0.39 q -1.43,-0.26 -1.43,-1.56 0,-1.3 1.43,-1.56 3.64,-0.78 6.11,-1.82 2.47,-1.04 4.16,-2.08 2.08,-1.3 3.12,-1.3 1.43,0 1.43,2.08 v 32.11 q 0,1.04 0.78,1.43 0.91,0.26 1.95,-0.78 5.59,-5.72 12.22,-5.72 5.98,0 10.53,4.03 4.68,3.9 7.28,10.92 2.73,7.02 2.73,16.51 0,10.79 -3.38,19.11 -3.38,8.32 -9.23,13 -5.72,4.68 -13,4.68 z m -0.26,-3.25 q 7.28,0 11.7,-8.58 4.55,-8.58 4.55,-23.14 0,-13.39 -3.9,-20.41 -3.9,-7.02 -11.05,-7.02 -4.42,0 -7.67,3.64 -3.25,3.64 -3.25,10.14 v 32.76 q 0,5.85 2.6,9.23 2.73,3.38 7.02,3.38 z m 57.46011,3.25 q -6.63,0 -11.96,-4.42 -5.2,-4.55 -8.32,-12.35 -3.12,-7.8 -3.12,-17.42 0,-9.62 3.12,-17.29 3.12,-7.67 8.45,-12.22 5.33,-4.55 11.83,-4.55 6.63,0 11.83,4.55 5.33,4.55 8.45,12.22 3.12,7.67 3.12,17.29 0,9.62 -3.12,17.42 -2.99,7.8 -8.32,12.35 -5.33,4.42 -11.96,4.42 z m 0,-3.25 q 13.52,0 13.52,-30.94 0,-30.81 -13.52,-30.81 -13.52,0 -13.52,30.81 0,30.94 13.52,30.94 z m 30.16011,28.73 q -1.95,0 -1.95,-1.43 0,-1.43 1.69,-1.56 l 1.82,-0.26 q 2.73,-0.39 3.51,-1.56 0.91,-1.17 0.91,-3.9 v -70.33 q 0,-2.34 -0.78,-3.12 -0.65,-0.91 -2.47,-1.17 l -2.73,-0.39 q -1.69,-0.13 -1.69,-1.43 0,-1.04 2.08,-1.43 4.03,-0.65 6.11,-2.08 2.21,-1.43 4.55,-3.51 1.17,-1.17 1.95,-1.17 1.17,0 1.17,1.56 v 4.03 q 0,0.91 0.78,1.3 0.78,0.26 1.82,-0.78 l 1.43,-1.43 q 2.6,-2.6 5.33,-3.77 2.73,-1.3 6.24,-1.3 5.98,0 10.53,4.03 4.68,3.9 7.28,10.92 2.73,7.02 2.73,16.51 0,10.79 -3.38,19.11 -3.38,8.32 -9.36,13 -5.85,4.68 -13.52,4.68 -3.9,0 -6.89,-1.43 -2.34,-1.04 -2.34,1.43 v 16.77 q 0,2.73 0.78,3.64 0.91,1.04 3.64,1.43 l 4.81,0.65 q 1.43,0.26 1.43,1.43 0,1.56 -1.95,1.56 z m 24.44,-28.73 q 7.28,0 11.7,-8.58 4.55,-8.58 4.55,-23.14 0,-13.39 -3.9,-20.41 -3.9,-7.02 -11.05,-7.02 -4.42,0 -7.67,3.64 -3.25,3.64 -3.25,10.14 v 32.76 q 0,5.85 2.6,9.23 2.73,3.38 7.02,3.38 z"/>
    <path d="m 485.87519,521.17 q -2.86,0 -4.94,-1.82 -1.95,-1.95 -1.95,-5.07 0,-2.99 1.95,-4.81 2.08,-1.95 4.94,-1.95 2.6,0 4.68,1.95 2.08,1.82 2.08,4.81 0,3.12 -2.08,5.07 -2.08,1.82 -4.68,1.82 z m 33.53993,0 q -5.72,0 -10.4,-3.77 -4.55,-3.9 -7.28,-11.05 -2.73,-7.15 -2.73,-17.03 0,-11.05 3.25,-19.24 3.38,-8.19 9.1,-12.61 5.72,-4.55 12.74,-4.55 5.98,0 9.36,2.34 1.3,0.91 1.3,2.86 l 0.26,15.86 q 0,1.95 -1.56,1.95 -1.43,0 -1.82,-1.69 -1.82,-7.15 -3.51,-11.05 -1.69,-3.9 -3.51,-5.33 -1.82,-1.56 -4.03,-1.56 -2.6,0 -5.46,2.99 -2.73,2.99 -4.68,9.75 -1.82,6.63 -1.82,17.55 0,13.91 3.51,20.93 3.64,7.02 9.36,7.02 4.55,0 7.54,-3.77 3.12,-3.77 5.33,-13.65 0.39,-1.43 1.56,-1.43 1.56,0 1.17,2.6 -1.43,9.1 -4.03,14.17 -2.47,4.94 -5.98,6.89 -3.38,1.82 -7.67,1.82 z m 23.2701,-1.17 q -1.56,0 -1.56,-1.43 0,-1.3 1.43,-1.56 l 1.82,-0.26 q 2.73,-0.39 4.03,-1.56 1.3,-1.17 1.3,-3.9 V 436.8 q 0,-2.34 -0.78,-3.25 -0.65,-0.91 -2.47,-1.04 l -2.99,-0.39 q -1.43,-0.26 -1.43,-1.56 0,-1.3 1.43,-1.56 3.64,-0.78 6.24,-1.82 2.6,-1.04 4.29,-2.08 2.08,-1.3 3.12,-1.3 1.43,0 1.43,2.08 v 85.41 q 0,2.73 0.78,3.9 0.91,1.04 3.64,1.43 l 2.99,0.39 q 1.43,0.26 1.43,1.56 0,1.43 -1.56,1.43 z"/>
  </g>
</svg>
"""

URL_THIN_DEFS = """
  <defs>
    <filter id="thin" x="0" y="0" width="1" height="1">
      <feMorphology operator="erode" radius="0.55"/>
    </filter>
  </defs>"""

# --- Brand/social templates -----------------------------------------------------

OG_SVG = """<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 630" role="img" aria-label="BipBop Labs">
  <title>BipBop Labs · software hecho con cariño</title>
  <defs>
    <radialGradient id="glow-tr" cx="55%" cy="0%" r="55%">
      <stop offset="0%" stop-color="{signal}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="{signal}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-bl" cx="8%" cy="100%" r="55%">
      <stop offset="0%" stop-color="{signal}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="{signal}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="{bg}"/>
  <rect width="1200" height="630" fill="url(#glow-tr)"/>
  <rect width="1200" height="630" fill="url(#glow-bl)"/>

  <image href="{icon_href}" x="200" y="220" width="200" height="200"/>

  <text x="1020" y="320" text-anchor="end"
        font-family="'Instrument Serif', 'Times New Roman', serif"
        font-size="120" fill="{text}"
    >Bip<tspan fill="{signal}">Bop</tspan> Labs<tspan fill="{signal}">_</tspan></text>

  <text x="1020" y="380" text-anchor="end"
        font-family="'Instrument Serif', 'Times New Roman', serif"
        font-size="34" fill="{secondary}"
    >Software hecho con cari&#241;o,</text>
  <text x="1020" y="424" text-anchor="end"
        font-family="'Instrument Serif', 'Times New Roman', serif"
        font-size="34" fill="{secondary}"
    >pensado contigo y construido a tu lado.</text>

  <line x1="88" y1="558" x2="1112" y2="558" stroke="{line}" stroke-width="1"/>
  <text x="88" y="592" font-family="'JetBrains Mono', 'SF Mono', Consolas, monospace"
        font-size="20" letter-spacing="5" fill="{tertiary}">SANTIAGO &#183; CL</text>
  <text x="1112" y="592" text-anchor="end" font-family="'JetBrains Mono', 'SF Mono', Consolas, monospace"
        font-size="20" letter-spacing="5" fill="{text}">BIPBOP.CL</text>
</svg>
"""

LINKEDIN_BANNER_SVG = """<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1584 396" role="img" aria-label="BipBop Labs">
  <title>BipBop Labs</title>
  <defs>
    <radialGradient id="glow-tr" cx="55%" cy="0%" r="55%">
      <stop offset="0%" stop-color="{signal}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="{signal}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-bl" cx="8%" cy="100%" r="55%">
      <stop offset="0%" stop-color="{signal}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="{signal}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1584" height="396" fill="{bg}"/>
  <rect width="1584" height="396" fill="url(#glow-tr)"/>
  <rect width="1584" height="396" fill="url(#glow-bl)"/>

  <image href="{logo_href}" x="640" y="78" width="146" height="240" preserveAspectRatio="xMidYMid meet"/>

  <text x="1180" y="218" text-anchor="end"
        font-family="'Instrument Serif', 'Times New Roman', serif"
        font-size="76" fill="{text}"
    >Bip<tspan fill="{signal}">Bop</tspan> Labs<tspan fill="{signal}">_</tspan></text>

  <text x="1180" y="262" text-anchor="end"
        font-family="'Instrument Serif', 'Times New Roman', serif"
        font-size="22" fill="{secondary}"
    >Software hecho con cari&#241;o,</text>
  <text x="1180" y="292" text-anchor="end"
        font-family="'Instrument Serif', 'Times New Roman', serif"
        font-size="22" fill="{secondary}"
    >pensado contigo y construido a tu lado.</text>
</svg>
"""

LINKEDIN_AVATAR_SVG = """<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400" role="img" aria-label="BipBop Labs">
  <defs>
    <radialGradient id="glow-tr" cx="55%" cy="0%" r="55%">
      <stop offset="0%" stop-color="{signal}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="{signal}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="{bg}"/>
  <rect width="400" height="400" fill="url(#glow-tr)"/>
  <image href="{icon_href}" x="60" y="50" width="280" height="280"/>
  <rect x="170" y="350" width="60" height="8" rx="2" fill="{signal}"/>
</svg>
"""

GITHUB_AVATAR_SVG = """<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 460 460" role="img" aria-label="BipBop Labs">
  <defs>
    <radialGradient id="glow-tr" cx="55%" cy="0%" r="55%">
      <stop offset="0%" stop-color="{signal}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="{signal}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="460" height="460" fill="{bg}"/>
  <rect width="460" height="460" fill="url(#glow-tr)"/>
  <image href="{icon_href}" x="70" y="60" width="320" height="320"/>
  <rect x="200" y="400" width="60" height="8" rx="2" fill="{signal}"/>
</svg>
"""

# Favicon: rounded tile with the head nearly full-bleed. Small sizes are
# re-rendered with a stroke on the paths ({bold}) because the line weights
# vanish at 16/32px otherwise.
FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <clipPath id="tile"><rect width="512" height="512" rx="100"/></clipPath>
    <radialGradient id="glow-tr" cx="55%" cy="0%" r="55%">
      <stop offset="0%" stop-color="{signal}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="{signal}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g clip-path="url(#tile)">
    <rect width="512" height="512" fill="{bg}"/>
    <rect width="512" height="512" fill="url(#glow-tr)"/>
    <g transform="translate(45.4,20) scale(0.85)">
      <g transform="translate(0,512) scale(0.1,-0.1)" fill="{text}"{bold}>
{head_paths}
      </g>
    </g>
    <rect x="256" y="452" width="88" height="18" rx="7" fill="{signal}"/>
  </g>
</svg>
"""

# (ico size, stroke-width in head path units to bolden thin lines)
FAVICON_SIZES = [(64, 0), (48, 0), (32, 80), (16, 140)]


def render_favicon(fmt: dict[str, str]) -> None:
    (GEN / "favicon.svg").write_text(FAVICON_SVG.format(bold="", **fmt))
    with tempfile.TemporaryDirectory() as tmp:
        pngs = []
        for size, stroke in FAVICON_SIZES:
            bold = (
                f' stroke="{fmt["text"]}" stroke-width="{stroke}"'
                ' stroke-linejoin="round"' if stroke else ""
            )
            svg = Path(tmp) / f"fav-{size}.svg"
            png = Path(tmp) / f"fav-{size}.png"
            svg.write_text(FAVICON_SVG.format(bold=bold, **fmt))
            rsvg(svg, png, w=size, h=size)
            pngs.append(str(png))
        subprocess.run(["magick", *pngs, str(GEN / "favicon.ico")], check=True)
    print("wrote brand/generated/favicon.svg + brand/generated/favicon.ico")


# --- Pipeline -------------------------------------------------------------------


def render(palette_name: str) -> None:
    if palette_name not in PALETTES:
        raise SystemExit(f"unknown palette '{palette_name}'. options: {', '.join(PALETTES)}")
    palette = PALETTES[palette_name]
    for tool in ("rsvg-convert", "magick"):
        if not shutil.which(tool):
            raise SystemExit(f"{tool} not found on PATH")

    for d in (GEN, SOCIAL, STICKERS):
        d.mkdir(parents=True, exist_ok=True)

    fmt = dict(
        palette,
        head_paths=vector_paths(HEAD_SRC),
        body_paths=vector_paths(BODY_SRC),
        icon_href=render_data_uri(HEAD_SRC, 512, 512),
        logo_href=render_data_uri(BODY_SRC, None, 1024),
    )

    # stickers, from the vector sources
    emit(STICKERS / "01-logo.svg", LOGO_STICKER_SVG.format(**fmt),
         [(STICKERS / "01-logo.png", dict(w=1200))])
    emit(STICKERS / "02-wordmark.svg", WORDMARK_STICKER_SVG.format(**fmt),
         [(STICKERS / "02-wordmark.png", dict(w=3000))])
    emit(STICKERS / "03-icon.svg", ICON_STICKER_SVG.format(**fmt),
         [(STICKERS / "03-icon.png", dict(w=1200, h=1200))])
    emit(STICKERS / "04-lockup-dark.svg", LOCKUP_DARK_SVG.format(**fmt),
         [(STICKERS / "04-lockup-dark.png", dict(w=1456, h=1880)),
          (STICKERS / "04-lockup-dark-on-black.png", dict(w=3000, bg="black"))])
    emit(STICKERS / "04-lockup-light.svg", LOCKUP_LIGHT_SVG.format(**fmt),
         [(STICKERS / "04-lockup-light.png", dict(w=1456, h=1880)),
          (STICKERS / "04-lockup-light-on-white.png", dict(w=3000, bg="white"))])
    emit(STICKERS / "05-url-dark.svg",
         URL_STICKER_SVG.format(variant="on dark", ink=palette["ink_on_dark"],
                                accent=palette["signal_on_dark"], thin_defs=URL_THIN_DEFS,
                                thin_attr=' filter="url(#thin)"', **fmt),
         [(STICKERS / "05-url-dark.png", dict(w=3000)),
          (STICKERS / "05-url-dark-on-black.png", dict(w=3000, bg="black"))])
    emit(STICKERS / "05-url-light.svg",
         URL_STICKER_SVG.format(variant="on light", ink=palette["text"],
                                accent=palette["signal"], thin_defs="", thin_attr="", **fmt),
         [(STICKERS / "05-url-light.png", dict(w=3000)),
          (STICKERS / "05-url-light-on-white.png", dict(w=3000, bg="white"))])

    # brand root: text wordmark + og + favicon
    emit(GEN / "wordmark.svg", WORDMARK_SVG.format(**fmt),
         [(GEN / "wordmark.png", dict(h=650))])
    emit(GEN / "og.svg", OG_SVG.format(**fmt),
         [(GEN / "og.png", dict(w=1200, h=630))])
    render_favicon(fmt)

    # social
    emit(SOCIAL / "linkedin-banner.svg", LINKEDIN_BANNER_SVG.format(**fmt),
         [(SOCIAL / "linkedin-banner.png", dict(w=1584, h=396))])
    emit(SOCIAL / "linkedin-avatar.svg", LINKEDIN_AVATAR_SVG.format(**fmt),
         [(SOCIAL / "linkedin-avatar.png", dict(w=400, h=400))])
    emit(SOCIAL / "github-avatar.svg", GITHUB_AVATAR_SVG.format(**fmt),
         [(SOCIAL / "github-avatar.png", dict(w=460, h=460))])

    # site background raster (index.html uses brand/bipbop_logo.webp)
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / "logo.png"
        rsvg(BODY_SRC, png, h=3922)
        subprocess.run(["magick", str(png), str(GEN / "bipbop_logo.webp")], check=True)
    print("wrote brand/generated/bipbop_logo.webp")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--palette", default="cream-moss",
        help=f"palette name (one of: {', '.join(PALETTES)})",
    )
    args = parser.parse_args()
    render(args.palette)


if __name__ == "__main__":
    main()
