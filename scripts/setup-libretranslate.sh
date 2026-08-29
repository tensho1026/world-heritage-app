#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
runtime_dir="$project_dir/.libretranslate-venv"

if [[ ! -x "$runtime_dir/bin/python" ]]; then
  python3 -m venv "$runtime_dir"
fi

"$runtime_dir/bin/python" -m pip install --upgrade pip
"$runtime_dir/bin/python" -m pip install "libretranslate==1.8.4"

echo "LibreTranslate is installed in $runtime_dir"
echo "Run npm run libretranslate:start, or npm run dev to start it."
