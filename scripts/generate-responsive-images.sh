#!/usr/bin/env bash
set -euo pipefail

# Reproducible responsive derivatives. Originals remain the largest srcset entry.
# A single thread avoids encoder output varying with worker scheduling.
encode() {
  local source=$1
  local width=$2
  local output=$3

  ffmpeg -hide_banner -loglevel error -y -i "$source" \
    -vf "scale=${width}:-2:flags=lanczos" \
    -c:v libwebp -preset picture -quality 82 -compression_level 6 \
    -pix_fmt yuva420p -threads 1 -map_metadata -1 "$output"
}

for width in 960 1440 1920 2560; do
  encode public/brand/skyline.webp "$width" "public/brand/skyline-${width}.webp"
done

for width in 480 768 1024; do
  encode public/brand/computer.webp "$width" "public/brand/computer-${width}.webp"
done

for width in 240 480; do
  encode public/brand/machine.webp "$width" "public/brand/machine-${width}.webp"
done
