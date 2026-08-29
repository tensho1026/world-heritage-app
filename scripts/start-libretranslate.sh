#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
runtime_dir="$project_dir/.libretranslate-venv"
executable="$runtime_dir/bin/libretranslate"

if [[ ! -x "$executable" ]]; then
  echo "LibreTranslate is not installed. Run: npm run libretranslate:setup" >&2
  exit 1
fi

exec env \
  ARGOS_DEBUG=0 \
  ARGOS_CHUNK_TYPE=MINISBD \
  ARGOS_INTER_THREADS=4 \
  ARGOS_INTRA_THREADS=1 \
  ARGOS_BATCH_SIZE=512 \
  "$executable" \
  --load-only en,ja \
  --disable-web-ui \
  --threads 4 \
  --host 127.0.0.1 \
  --port 5001
