# Props Platform — Setup & Deployment Guide

## Repo layout
- api/ : Node.js (Express) + Prisma API
- web/ : Next.js 16 + React 19 frontend
- docker-compose.yml : local/dev orchestration
- agent.md : token-efficient prompt guide
- .env.example : shared env template

## Prerequisites
- Node.js 22 LTS
- Docker & Docker Compose (for easiest local/prod-like run)
- PostgreSQL 16 (if not using Docker db)

## Environment
Copy and edit `.env.example` to `.env` at repo root.
Key vars: DATABASE_URL, JWT_* secrets, cloud storage keys (Cloudinary/S3), SMTP creds, FRONTEND_URL/BACKEND_URL.

## Local development (fast path)
```bash
# one-liner bootstrap
./run-local.sh
```
Hot reload: both api and web run in watch mode (api: ts-node-dev, web: Next dev). If you prefer manual steps, see “Local development (without Docker)” below.

## Local development (without Docker)
```bash
# API
cd api
npm install
npm run prisma:generate
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run dev   # http://localhost:4000

# Web
cd ../web
npm install
npm run dev   # http://localhost:3000
```

## Production build (Docker)
```bash
docker-compose -f docker-compose.yml build
# optional: export NODE_ENV=production in .env
docker-compose -f docker-compose.yml up -d
# run migrations in container once
docker-compose exec backend npx prisma migrate deploy
```

## Shared hosting (no Docker)
1) Provision PostgreSQL and note DATABASE_URL.
2) On the host:
   - Install Node 22 and PM2.
   - `cd api && npm ci && npm run prisma:generate && npx prisma migrate deploy && npm run build`
   - Start API: `pm2 start dist/server.js --name props-api`
   - `cd ../web && npm ci && npm run build`
   - Start web: `pm2 start "npm run start" --name props-web -- --hostname 0.0.0.0 --port 3000`
3) Configure reverse proxy (NGINX/Apache) to route 80/443 → web:3000; set BACKEND_URL env to API domain.
4) Set up systemd/PM2 startup scripts and HTTPS (Let’s Encrypt).

## AWS-ready notes (future)
- Use RDS Postgres, S3 for images, SES for email.
- Deploy containers to ECS/Fargate or EKS; store secrets in SSM Parameter Store; use ALB for HTTPS.
- Add CloudFront in front of web for CDN caching; enable image optimization with Cloudinary/S3-backed Next Image loader.
- Enable Prisma connection pooling via RDS proxy or pgBouncer sidecar.

## Smoke checks
- Health: `curl http://localhost:4000/health`
- Auth: POST /auth/register then /auth/login
- Properties: GET /properties should return empty list initially; seed manually or via API.

## Naming
Services are referenced as `backend` (api) and `frontend` (web) in docker-compose for compatibility; folders are `api/` and `web/`.
