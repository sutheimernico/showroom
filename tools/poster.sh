#!/usr/bin/env bash
# Wrapper for the poster renderer: same libasound workaround as shot.sh.
# Usage: bash tools/poster.sh [slug]
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export LD_LIBRARY_PATH="${HERE}/deps/extract/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
exec node "${HERE}/poster.mjs" "$@"
