#!/usr/bin/env bash
# Wrapper for the Playwright screenshot harness: puts the locally-extracted
# libasound (no-root workaround for headless Chromium on WSL2) on the library path.
# Usage: bash tools/shot.sh <url> <slug> [width] [height]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export LD_LIBRARY_PATH="${HERE}/deps/extract/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
exec node "${HERE}/shot.mjs" "$@"
