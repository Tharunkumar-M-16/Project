#!/usr/bin/env bash
#
# ReadyScore — one-command setup for a fresh Ubuntu VPS (Hostinger KVM, etc.)
# Run as root from the project root:
#
#     sudo bash deploy/setup.sh [your-domain.com]
#
# Before running: create server/.env (copy server/.env.production.example and fill in
# your MongoDB Atlas MONGO_URI, a strong JWT_SECRET, and staff passwords).
#
set -euo pipefail

DOMAIN="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> ReadyScore setup starting in $ROOT"

# 1. System dependencies -----------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "==> Installing git, nginx..."
apt-get install -y git nginx >/dev/null
if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing PM2..."
  npm install -g pm2 >/dev/null
fi
echo "    node $(node -v), npm $(npm -v)"

# 2. Environment file --------------------------------------------------------
if [ ! -f server/.env ]; then
  cp server/.env.production.example server/.env
  echo ""
  echo "!!  Created server/.env from the example."
  echo "!!  Edit it now with your Atlas MONGO_URI, JWT_SECRET and passwords:"
  echo "!!      nano server/.env"
  echo "!!  Then run this script again."
  exit 1
fi

# 3. Install deps + build the React app -------------------------------------
echo "==> Installing dependencies and building the frontend..."
npm run setup:prod

# 4. Seed once (creates admin + mentor) -------------------------------------
if [ ! -f server/.seeded ]; then
  echo "==> First-time database seed (creates admin + mentor)..."
  ( cd server && npm run seed )
  touch server/.seeded
else
  echo "==> Skipping seed (already done). To reset: rm server/.seeded && (cd server && npm run seed)"
fi

# 5. Start with PM2 ----------------------------------------------------------
echo "==> Starting app with PM2..."
pm2 start ecosystem.config.cjs 2>/dev/null || pm2 restart readyscore
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

# 6. Nginx reverse proxy (port 80 -> app on 5000) ---------------------------
SERVER_NAME="${DOMAIN:-_}"
echo "==> Configuring nginx (server_name: $SERVER_NAME)..."
cat > /etc/nginx/sites-available/readyscore <<NGINX
server {
    listen 80;
    server_name ${SERVER_NAME};
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/readyscore /etc/nginx/sites-enabled/readyscore
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "✅ ReadyScore is live!"
if [ -n "$DOMAIN" ]; then
  echo "   Open:  http://$DOMAIN     (enable HTTPS: certbot --nginx -d $DOMAIN)"
else
  echo "   Open:  http://<your-server-ip>"
fi
echo "   Staff login: /manual-login   ·   Users: created by the mentor"
echo "   Logs: pm2 logs readyscore"
