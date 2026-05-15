#!/usr/bin/env python3
"""
Regenerate brand SVGs and PNGs (OG image, LinkedIn banner, social avatars)
from a single palette + the source penguin icon.

Tweak PALETTE below (or pass --palette name) and re-run:
    python3 scripts/generate-brand.py

Requires `rsvg-convert` on PATH.
"""

from __future__ import annotations

import argparse
import base64
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
SOCIAL = BRAND / "social"
# rsvg-convert doesn't decode webp, so we embed a PNG copy of the icon as a
# data URI. Regenerate brand/bipbop_icon.png from the webp if the source changes.
ICON_PNG = BRAND / "bipbop_icon.png"
LOGO_PNG = BRAND / "bipbop_logo.png"


def data_uri(path: Path, hint: str) -> str:
    if not path.exists():
        raise SystemExit(
            f"missing {path.relative_to(ROOT)} — generate it once with:\n  {hint}"
        )
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:image/png;base64,{b64}"


def icon_data_uri() -> str:
    return data_uri(
        ICON_PNG,
        "magick brand/bipbop_icon.webp -resize 512x512 -background none brand/bipbop_icon.png",
    )


def logo_data_uri() -> str:
    return data_uri(
        LOGO_PNG,
        "magick brand/bipbop_logo.webp -resize x1024 -background none brand/bipbop_logo.png",
    )

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
    },
    # example alternates — feel free to edit
    "slate-amber": {
        "bg":        "#f4f1ec",
        "text":      "#1b1d22",
        "secondary": "#5a5f6a",
        "tertiary":  "#9aa0aa",
        "line":      "#d8dae0",
        "signal":    "#c47a1a",
    },
    "ink-pine": {
        "bg":        "#f6f4ef",
        "text":      "#10221a",
        "secondary": "#4f5d56",
        "tertiary":  "#94a39b",
        "line":      "#d4dcd6",
        "signal":    "#0e6b3c",
    },
}

# --- Templates ----------------------------------------------------------------
# Plain str.format wouldn't work nicely with CSS braces, so we use {tokens}
# only where colors go and keep everything else literal. Each template
# describes one SVG. `icon_href` is supplied at render time so the same
# template can point to either ../bipbop_icon.webp or bipbop_icon.webp.

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

# (svg path, png path, width, height, template)
ASSETS = [
    (BRAND / "og.svg",                       BRAND / "og.png",                       1200, 630,  OG_SVG),
    (SOCIAL / "linkedin-banner.svg",         SOCIAL / "linkedin-banner.png",         1584, 396,  LINKEDIN_BANNER_SVG),
    (SOCIAL / "linkedin-avatar.svg",         SOCIAL / "linkedin-avatar.png",         400,  400,  LINKEDIN_AVATAR_SVG),
    (SOCIAL / "github-avatar.svg",           SOCIAL / "github-avatar.png",           460,  460,  GITHUB_AVATAR_SVG),
]


def render(palette_name: str) -> None:
    if palette_name not in PALETTES:
        raise SystemExit(f"unknown palette '{palette_name}'. options: {', '.join(PALETTES)}")
    palette = PALETTES[palette_name]
    if not shutil.which("rsvg-convert"):
        raise SystemExit("rsvg-convert not found on PATH")

    icon_href = icon_data_uri()
    logo_href = logo_data_uri()
    for svg_path, png_path, w, h, template in ASSETS:
        svg_path.write_text(
            template.format(icon_href=icon_href, logo_href=logo_href, **palette)
        )
        subprocess.run(
            ["rsvg-convert", "-w", str(w), "-h", str(h), str(svg_path), "-o", str(png_path)],
            check=True,
        )
        print(f"wrote {svg_path.relative_to(ROOT)} + {png_path.relative_to(ROOT)}")


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
