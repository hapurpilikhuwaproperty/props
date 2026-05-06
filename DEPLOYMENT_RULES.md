# Deployment Rules

These rules are the default for this project.

- Deploy frontend/UI only unless backend deployment is explicitly requested.
- Do not deploy the backend for UI, CSS, component, page, or copy changes.
- Do not include `.env`, `.env.local`, `.env.production`, `hostinger-api.env`, or `hostinger-web.env` in normal deployment archives.
- Production environment values are managed on Hostinger and should not be overwritten by code deployments.
- Frontend code deployments should package only the `web/` codebase and exclude `node_modules`, `.next`, local logs, and generated archives.
- Backend deployment is only for explicit API, Prisma/schema, auth, upload, or server changes.
