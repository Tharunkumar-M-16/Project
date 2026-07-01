#!/usr/bin/env bash
#
# Pull the latest code and restart ReadyScore (run on the VPS from the project root):
#     bash deploy/update.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Pulling latest code..."
git pull

echo "==> Installing deps + rebuilding frontend..."
npm run setup:prod

echo "==> Restarting app..."
pm2 restart readyscore

echo "✅ Updated. (pm2 logs readyscore to watch output)"
