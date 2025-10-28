# Data folder

This folder contains assets and infrastructure files for the AUAS Web Lab database.

- `docker-compose.yaml` — PostgreSQL service definition. The setup script starts this under the project name `database`.
- `DDL_INSPECTION.sql` — Creates core tables (DIM_USER, FCT_INSPECTION, DIM_PIECE).
- `DDL_DASHBOARD_VIEWS.sql` — Creates reporting views used by Prisma.
- `example_data/` — Sample data files for initial seeding.
  - `user.csv` — Semicolon-delimited initial user(s) for `DIM_USER`.

## Usage
Start the database:
```powershell
docker compose -f .\docker-compose.yaml -p database up -d
```
Apply DDLs manually (optional if you used the setup script):
- Use a SQL client (psql, DBeaver, etc.) to run the SQL files in order:
  1. `DDL_INSPECTION.sql`
  2. `DDL_DASHBOARD_VIEWS.sql`
