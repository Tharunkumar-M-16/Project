# Deploying ReadyScore to Hostinger

ReadyScore is a **MERN app** (Node.js + MongoDB). Two important facts up front:

1. **Hostinger *shared/web* hosting will NOT run this app.** Shared plans are PHP + MySQL
   only — no Node.js server, no MongoDB. You need a **Hostinger VPS** (KVM plan) which
   gives you a full Ubuntu server with root access.
2. **MongoDB** isn't offered by Hostinger. Use **MongoDB Atlas** (free M0 tier) for the
   database, or install MongoDB yourself on the VPS. Atlas is easier and recommended.

In production the **Node server serves the built React app *and* the API on one port**,
so you only run **one process**.

---

## ⚡ Quick deploy (one command)

Once you have a VPS + your code on it + `server/.env` filled in, the whole install is:

```bash
sudo bash deploy/setup.sh your-domain.com      # omit the domain to just use the IP
```

That script installs Node/nginx/PM2, builds the app, seeds the admin+mentor accounts,
starts it under PM2, and wires up nginx. To update later: `bash deploy/update.sh`.

The manual walkthrough below explains each step (useful for troubleshooting).

---

## What you need
- A **Hostinger VPS** (Ubuntu 22.04+) — from hPanel → VPS
- A **domain** (or subdomain) pointed at the VPS IP (an `A` record)
- A free **MongoDB Atlas** account → a cluster → a connection string
- The code on GitHub (easiest) or uploaded via SFTP

---

## Step 1 — MongoDB Atlas (free database)
1. Create a free cluster at https://www.mongodb.com/atlas
2. **Database Access** → add a user + password.
3. **Network Access** → allow your VPS IP (or `0.0.0.0/0` to start).
4. **Connect → Drivers** → copy the connection string, e.g.
   `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/readyscore`

## Step 2 — Prepare the VPS
SSH in (`ssh root@YOUR_VPS_IP`) and install Node, git, nginx:
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx
npm install -g pm2
node -v && npm -v
```

## Step 3 — Get the code
```bash
cd /var/www
git clone <YOUR_REPO_URL> readyscore   # or upload the folder via SFTP
cd readyscore
```

## Step 4 — Configure environment
```bash
cp server/.env.production.example server/.env
nano server/.env      # set MONGO_URI (Atlas), a long random JWT_SECRET,
                      # your domain in CLIENT_URL, and staff passwords
```

## Step 5 — Install + build + seed
```bash
npm run setup:prod        # installs server + client deps and builds the React app
cd server && npm run seed # creates the admin + mentor accounts from .env
cd ..
```

## Step 6 — Run it with PM2 (stays up + restarts on reboot)
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup     # run the command it prints, to start on boot
pm2 logs readyscore   # check it booted (should say "running on port 5000 (production)")
```

## Step 7 — Nginx reverse proxy (domain → app)
```bash
cp deploy/nginx.conf.example /etc/nginx/sites-available/readyscore
nano /etc/nginx/sites-available/readyscore   # replace your-domain.com
ln -s /etc/nginx/sites-available/readyscore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```
Now http://your-domain.com should show the app.

## Step 8 — Free HTTPS
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Logging in after deploy
- **Staff:** go to `https://your-domain.com/manual-login` → admin / mentor (the IDs &
  passwords you set in `server/.env`).
- **Users:** the mentor creates student/tutor logins from the Mentor control panel.

## Updating later
```bash
cd /var/www/readyscore
git pull
npm run setup:prod
pm2 restart readyscore
```

---

## Alternative: no VPS?
If you can't use a VPS, host the two parts on free platforms instead of Hostinger:
- **Frontend** (client/dist) → Hostinger static hosting, Netlify, or Vercel
- **Backend** → Render / Railway / Fly.io (free tiers), with MongoDB Atlas
- In that split setup, set the frontend to call the backend URL (change axios `baseURL`
  from `/api` to `https://your-api-host/api`) and set `CLIENT_URL` on the backend for CORS.
