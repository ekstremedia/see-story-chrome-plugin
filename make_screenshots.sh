#!/usr/bin/env bash
# Capture 1280x800 store screenshots on a sway desktop.
#
# Launches a throwaway Chrome profile with this extension loaded, sized to the
# store's preferred 1280x800, then waits for you to press Enter and grabs the
# focused window with grim.
#
#   ./make_screenshots.sh 01-options
#
set -euo pipefail

name="${1:-screenshot}"
dir="store/screenshots"
profile="$(mktemp -d)"
chrome="$(command -v google-chrome || command -v chromium || true)"

[ -n "$chrome" ] || { echo "no chrome/chromium found" >&2; exit 1; }
command -v grim >/dev/null || { echo "grim not installed" >&2; exit 1; }

mkdir -p "$dir"
export $(systemctl --user show-environment | grep -E '^(WAYLAND_DISPLAY|SWAYSOCK)=' | xargs)

"$chrome" \
  --user-data-dir="$profile" \
  --load-extension="$PWD" \
  --window-size=1280,800 \
  --no-first-run \
  --no-default-browser-check \
  "chrome://extensions" >/dev/null 2>&1 &
chrome_pid=$!

echo "Chrome up with the extension loaded."
echo "Set up the shot (options page, or a page before/after a click), then press Enter."
read -r

geometry="$(swaymsg -t get_tree | python3 -c '
import json, sys
def walk(n):
    if n.get("focused"):
        r = n["rect"]
        print(f"{r[\"x\"]},{r[\"y\"]} {r[\"width\"]}x{r[\"height\"]}")
        return True
    return any(walk(c) for c in n.get("nodes", []) + n.get("floating_nodes", []))
walk(json.load(sys.stdin))
')"

grim -g "$geometry" "$dir/$name.png"
python3 - "$dir/$name.png" <<'PY'
import sys
from PIL import Image
p = sys.argv[1]
img = Image.open(p).convert("RGB")
if img.size != (1280, 800):
    # The store wants exactly 1280x800: cover-crop, then resize.
    scale = max(1280 / img.width, 800 / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - 1280) // 2, (img.height - 800) // 2
    img = img.crop((left, top, left + 1280, top + 800))
    img.save(p)
print(p, img.size)
PY

kill "$chrome_pid" 2>/dev/null || true
rm -rf "$profile"
