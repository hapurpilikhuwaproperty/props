###
# Props Platform

Full-stack real estate listings app (Next.js 16 / React 19 / Tailwind, Express + Prisma + Postgres).

## Prerequisites
- Node 20+ (22 LTS recommended)
- PostgreSQL 16 (or Docker if you prefer containers)
- npm

## Environment
Copy `.env.example` to `.env` at repo root and fill secrets:
- `DATABASE_URL` (e.g. `postgresql://postgres:postgres@localhost:5432/props`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `FRONTEND_URL`, `BACKEND_URL` (local: http://localhost:3000 / http://localhost:4000)
- Storage/SMTP keys can stay blank for local.

## Run locally (native, Homebrew Postgres)
```bash
# API
cd api
npm ci
npm run prisma:generate
npx prisma migrate dev
npx prisma db seed || DATABASE_URL=... node --loader ts-node/esm prisma/seed.ts
PORT=4000 DATABASE_URL=postgresql://<user>@localhost:5432/props npm run dev

# Web (new terminal)
cd ../web
npm ci
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000 npm run dev -- --hostname 0.0.0.0 --port 3000
```
Open: http://localhost:3000 (API health: http://localhost:4000/health)

> If your corporate proxy blocks Prisma engine download, rerun generate/migrate with `NODE_TLS_REJECT_UNAUTHORIZED=0` (or pass `--prisma-insecure` to `run-local.sh`).

### OTP & reset (email) setup
- The API sends OTP/reset via SMTP (nodemailer). Ensure EMAIL_* vars are set in `.env`.
- After pulling new schema, run `npx prisma migrate dev` (or `prisma migrate deploy` in prod) to create `OtpCode` and `PasswordReset` tables.
- OTP endpoints: `/auth/otp/request` (body: {email}) and `/auth/otp/verify` (email, code).
- Reset endpoints: `/auth/forgot` (email) sends link; `/auth/reset` (token, new password) completes.

## Run locally (Docker all-in-one)
```bash
./run-local.sh           # builds db/api/web, runs migrations & seed
# or, manual:
docker compose up --build -d
docker compose exec backend npm run prisma:generate
docker compose exec backend npx prisma migrate dev
docker compose exec backend npx ts-node prisma/seed.ts
```
Web: http://localhost:3000, API: http://localhost:4000

## Production (shared/VPS, no Docker)
1) Install Node 22, Postgres 16, and PM2 (`npm i -g pm2`).
2) Set `.env` with production DATABASE_URL and secrets.
3) API:
```bash
cd api
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run build
PORT=4000 pm2 start dist/server.js --name props-api
```
4) Web:
```bash
cd ../web
npm ci
npm run build
NEXT_PUBLIC_BACKEND_URL=https://your-api pm2 start "npm run start" --name props-web -- --hostname 0.0.0.0 --port 3000
```
5) Reverse proxy (NGINX/Apache) routes 80/443 → web:3000 and /api → api:4000; enable HTTPS (Let’s Encrypt). Set `NODE_ENV=production` for both services. Persist PM2: `pm2 save && pm2 startup`.

## Project structure
- `api/` Express + Prisma API
- `web/` Next.js frontend
- `run-local.sh` helper for dev
- `PROJECT.md` detailed guide

## Common issues
- **Prisma download TLS error**: run with `--prisma-insecure` for generate/migrate (dev only).
- **Port in use (3000/4000)**: `lsof -i :3000` then `kill <pid>`; restart dev servers.
- **Header shows Login after auth**: ensure `accessToken` is in localStorage; refresh.

## Add a property (UI)
Login → Dashboard → “+ Add property” → submit form (creates via /properties).
