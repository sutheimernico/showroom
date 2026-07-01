#!/usr/bin/env bash
# Start the local showroom server, then open http://localhost:8080
set -euo pipefail
PORT="${1:-8080}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Showroom → http://localhost:${PORT}  (serving ${DIR})"
exec python3 -m http.server "${PORT}" --directory "${DIR}"
