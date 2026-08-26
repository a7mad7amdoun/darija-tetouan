#!/bin/bash
# Resize the Tetouan photos for the web while keeping them sharp.
# Originals are preserved untouched in assets/photos/originals/.
set -e
cd "$(dirname "$0")"
DIR=assets/photos
ORIG=$DIR/originals
mkdir -p "$ORIG"

WIDTH=2400      # plenty for a retina hero
QUALITY=88      # high — these are the reason the page looks good

shopt -s nullglob
found=0
for f in "$DIR"/*.jpg "$DIR"/*.jpeg "$DIR"/*.JPG "$DIR"/*.png "$DIR"/*.heic "$DIR"/*.HEIC; do
  name=$(basename "$f")
  base="${name%.*}"
  [ -f "$ORIG/$name" ] || cp "$f" "$ORIG/$name"
  w=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
  sips -s format jpeg -s formatOptions $QUALITY "$ORIG/$name" --out "$DIR/$base.jpg" >/dev/null 2>&1
  if [ -n "$w" ] && [ "$w" -gt "$WIDTH" ]; then
    sips --resampleWidth $WIDTH "$DIR/$base.jpg" >/dev/null 2>&1
  fi
  new=$(sips -g pixelWidth "$DIR/$base.jpg" 2>/dev/null | awk '/pixelWidth/{print $2}')
  size=$(du -h "$DIR/$base.jpg" | cut -f1)
  echo "  $base.jpg  ${w}px -> ${new}px  ($size)"
  found=$((found+1))
done

if [ "$found" -eq 0 ]; then
  echo "No photos found in $DIR — see $DIR/README.md for the filenames."
  exit 0
fi
echo
echo "Done: $found photo(s) optimised. Originals kept in $ORIG/"
