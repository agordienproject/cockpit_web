# Backend (Node.js / Express)

REST API for authentication, inspections, users, and dashboards. Uses Prisma to access PostgreSQL.

## Prerequisites
- Node.js LTS (v18+ recommended)
- Running Postgres (see `../data/docker-compose.yaml`)

## Environment
Copy the template and adjust values if needed:
```powershell
copy .env_template .env
```
Key variables:
- `PORT_SERVEUR` — API port (default 3000)
- `GLOBAL_IP` — Host IP to display URLs in logs
- `DATABASE_URL_PSQL` — Prisma connection string (postgresql://user:pass@host:port/db?schema=public)
- `FRONTEND_URL` — CORS origin for the frontend (e.g., http://127.0.0.1:4000)

## Install & run (dev)
```powershell
npm install
npx prisma db pull --schema=./prisma/schema_psql.prisma
npx prisma generate --schema=./prisma/schema_psql.prisma
npm run dev
```
This runs `nodemon` with `ts-node src/server.ts` as configured in `nodemon.json`.

## Build & run (prod, optional)
```powershell
REM If you add a build step to output dist/
REM npm run build
node dist/index.js
```

## Notes
- Server binds to `0.0.0.0` (see `src/server.ts`) so it’s reachable on your LAN; it logs with `GLOBAL_IP`.
- Update `FRONTEND_URL` if your frontend runs elsewhere.
