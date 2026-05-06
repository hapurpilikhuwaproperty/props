#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE="$ROOT_DIR/web-code-only-$STAMP.zip"

cd "$ROOT_DIR/web"
zip -qr "$ARCHIVE" . \
  -x 'node_modules/*' \
  -x '.next/*' \
  -x '.env' \
  -x '.env.*' \
  -x '.DS_Store' \
  -x '*/.DS_Store'

echo "$ARCHIVE"
