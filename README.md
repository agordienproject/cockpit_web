# AUAS Web Lab

A full-stack web application for managing and inspecting pieces and scenarios. It includes:
- PostgreSQL database (via Docker Compose)
- Backend API (Node.js/Express + Prisma)
- Frontend UI (React)

## Prerequisites
- Docker Desktop (with Docker Compose)
- Node.js LTS (v18+ recommended) and npm
- Python 3.10+ (for the one-time setup helper)

Optional but recommended:
- Git

## One-time setup (automated)
Run the helper to provision database, apply schema, create env files, and install deps:

```powershell
cd "c:\Users\Agordien\Documents\projects\AUAS\auas_web_lab"
python .\install.py
```
Follow the prompts for IP and DB credentials. This will:
- Update and start Docker Compose under the project name "database"
- Initialize tables/views and seed example users
- Create `.env` files in `backend/` and `frontend/`
- Install npm dependencies and run Prisma pull/generate

## Manual quick start (if you prefer)
- Database:
  ```powershell
  docker compose -f .\data\docker-compose.yaml -p database up -d
  ```
- Backend:
  ```powershell
  cd .\backend
  copy .env_template .env  # if not already created
  npm install
  npx prisma db pull --schema=./prisma/schema_psql.prisma
  npx prisma generate --schema=./prisma/schema_psql.prisma
  npm run dev
  ```
- Frontend:
  ```powershell
  cd ..\frontend
  copy .env_template .env  # if not already created
  npm install
  npm start
  ```

## Project structure

See the README in each folder for details.

## Worker Health Verification

You can create a worker (via the UI or API) which generates `creds_worker`. With these credentials you can run the Python health verification worker that:
1. Calls the backend health endpoint `/api/health`.
2. Submits a verification to `/api/verifications` using only its credentials.

### Health Endpoint
`GET /api/health` returns JSON:
```json
{ "status": "UP", "db": "UP", "ms": 12 }
```
Status is `UP` if the application and database are reachable, else `DOWN`.

### Python Worker Script
File: `worker_health_verifier.py`

Install dependency:
```bash
pip install requests
```
Run script:
```bash
python worker_health_verifier.py --base-url http://127.0.0.1:3001/api --creds <worker_creds>
```
Example output:
```json
{
  "health_status": "UP",
  "verif_status": "OK",
  "submitted": true,
  "verification_response": { "id_verif": 5, "status": "OK", "details": "..." }
}
```

The backend automatically maps the credentials to `id_worker`, `id_sys`, and `id_machine` when creating the verification.

### Verification Statuses
Verifications now enforce allowed statuses: `OK`, `WARN`, `ERROR`.
The health worker script maps service availability to `OK` (reachable) or `ERROR` (unreachable). You can introduce `WARN` for partial degradation scenarios in custom workers.

## Troubleshooting
- Orphan containers warning: add `--remove-orphans` to the compose command or clean up in Docker Desktop.
- npm not found: ensure Node.js is installed and open a new PowerShell session.
- DB connection issues: verify host/port in `backend/.env` (DATABASE_URL_PSQL) and that the container is running.
