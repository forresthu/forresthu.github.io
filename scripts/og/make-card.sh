#!/bin/bash
# 生成社交分享用的 1200x630 预览图（LinkedIn / Twitter / 微信）
#
#   scripts/og/make-card.sh <输出文件名> <标题> [副标题] [小标签]
#
# 例：
#   scripts/og/make-card.sh rfdiffusion.png \
#     "RFdiffusion: Diffusion Models on Protein Structure" \
#     "Diffusion on the SE(3) manifold, and what transfers back to ordinary ML." \
#     "Machine Learning"
#
# 结果写到 public/upload/og/<输出文件名>，然后在文章 front matter 里写：
#   image: /public/upload/og/<输出文件名>
set -euo pipefail

CHROME="${CHROME:-/Applications/Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "找不到 Chrome，可用 CHROME=/path/to/chrome 指定" >&2; exit 1; }

[ $# -ge 2 ] || { sed -n '2,14p' "$0"; exit 1; }

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/public/upload/og/$1"
PORT="${PORT:-4127}"

urlencode() { python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$1"; }
QS="title=$(urlencode "$2")&sub=$(urlencode "${3:-}")&kicker=$(urlencode "${4:-}")"

mkdir -p "$(dirname "$OUT")"
python3 -m http.server "$PORT" --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for _ in $(seq 1 40); do
  curl -sf -o /dev/null "http://127.0.0.1:$PORT/scripts/og/template.html" && break
  sleep 0.25
done

"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 \
  --screenshot="$OUT" "http://127.0.0.1:$PORT/scripts/og/template.html?$QS" 2>/dev/null

echo "已生成 $OUT"
