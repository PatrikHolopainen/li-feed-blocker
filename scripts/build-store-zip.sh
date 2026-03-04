#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
VERSION="$(node -pe "require('$ROOT_DIR/manifest.json').version")"
OUTPUT_ZIP="$DIST_DIR/li-feed-blocker-v${VERSION}.zip"

mkdir -p "$DIST_DIR"
rm -f "$OUTPUT_ZIP"

cd "$ROOT_DIR"
zip -r "$OUTPUT_ZIP" \
  manifest.json \
  content.js \
  icons \
  README.md \
  PRIVACY_POLICY.md \
  >/dev/null

echo "Created $OUTPUT_ZIP"
