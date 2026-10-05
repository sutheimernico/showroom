#!/usr/bin/env bash
# Fetch the large Poly Haven model buffer that is deliberately not committed (40 MB).
# island_tree_02 (CC0) is the photoscanned tree used by designs/01-house-walkthrough.
set -euo pipefail
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/designs/01-house-walkthrough/models/island_tree_02"
mkdir -p "${DEST}"
curl -fL -o "${DEST}/island_tree_02.bin" \
  "https://dl.polyhaven.org/file/ph-assets/Models/gltf/8k/island_tree_02/island_tree_02.bin"
echo "Saved ${DEST}/island_tree_02.bin"
