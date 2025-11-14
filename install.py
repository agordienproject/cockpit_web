import sys
import time
import getpass
import subprocess
import os
import shutil
import stat
from pathlib import Path


def ensure_package(pip_name: str, import_name: str | None = None):
    """Ensure a Python package is installed; install via pip if missing."""
    mod = import_name or pip_name
    try:
        __import__(mod)
        return
    except ImportError as exc:
        print(f"Installing missing Python package: {pip_name} …")
        cmd = [sys.executable, "-m", "pip", "install", pip_name]
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if res.returncode != 0:
            print(res.stdout)
            print(res.stderr)
            raise RuntimeError(f"Failed to install required package: {pip_name}") from exc


def prompt_with_default(prompt: str, default: str | None = None, secret: bool = False) -> str:
    suffix = f" [{default}]" if default else ""
    full = f"{prompt}{suffix}: "
    if secret:
        val = getpass.getpass(full)
    else:
        val = input(full)
    if not val and default is not None:
        return default
    return val


def is_command_available(cmd: list[str]) -> bool:
    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        return True
    except FileNotFoundError:
        return False


def run_command(cmd: list[str], cwd: Path | None = None, env: dict | None = None, check: bool = True) -> int:
    print(f"→ Running: {' '.join(cmd)}" + (f" (cwd={cwd})" if cwd else ""))
    res = subprocess.run(cmd, cwd=str(cwd) if cwd else None, env=env, check=check)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {res.returncode}: {' '.join(cmd)}")
    return res.returncode


# Simple, cross-platform helper to remove a directory tree.
# Uses shutil.rmtree with a tiny onerror that clears read-only attr on Windows.
def remove_dir_simple(target: Path):
    if not target.exists():
        return
    def _on_rm_error(func, path, exc_info):
        try:
            os.chmod(path, stat.S_IWRITE)
            func(path)
        except Exception:
            pass
    try:
        shutil.rmtree(target, onerror=_on_rm_error)
    except PermissionError:
        # As a last resort on Windows, use native rmdir which often succeeds against locked attrs
        if os.name == 'nt':
            subprocess.run(["cmd", "/c", "rd", "/s", "/q", str(target)], check=False)
        else:
            raise


def resolve_command(candidates: list[str]) -> list[str]:
    """Return a runnable command list for the first available candidate.
    Example: resolve_command(["npm", "npm.cmd", "npm.exe"]) -> ["npm"]
    """
    for name in candidates:
        try:
            subprocess.run([name, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
            return [name]
        except FileNotFoundError:
            continue
    raise RuntimeError(f"None of these commands were found on PATH: {', '.join(candidates)}")


def update_docker_compose(compose_path: Path, db_user: str, db_password: str, db_name: str, host_port: int, svc_name: str, volume_name: str):
    ensure_package("pyyaml", "yaml")
    import yaml  # type: ignore

    with compose_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    # Defensive defaults
    data = data or {}
    services = data.setdefault("services", {})
    # Use provided service name (container/service identifier in compose)
    svc = services.setdefault(svc_name, {})

    # Ensure required fields for a valid service
    if not svc.get("image"):
        # Prefer an explicit, supported Postgres major version so installs are reproducible.
        svc["image"] = "postgres:17"
    svc.setdefault("restart", "always")

    env = svc.setdefault("environment", {})
    env["POSTGRES_USER"] = db_user
    env["POSTGRES_PASSWORD"] = db_password
    env["POSTGRES_DB"] = db_name

    # ports: list of strings like "HOST:CONTAINER"
    svc["ports"] = [f"{host_port}:5432"]

    # volumes: ensure the named volume is mounted to Postgres data dir
    if not svc.get("volumes"):
        svc["volumes"] = [f"{volume_name}:/var/lib/postgresql/data"]

    # Ensure top-level volumes map contains the named volume so docker-compose creates it
    vols = data.setdefault("volumes", {})
    if volume_name not in vols:
        vols[volume_name] = None

    # Optionally prune duplicate broken services (no image and no build)
    to_delete = []
    for name, svc_def in services.items():
        if name == svc_name:
            continue
        if not isinstance(svc_def, dict):
            continue
        if not svc_def.get("image") and not svc_def.get("build"):
            to_delete.append(name)
    for name in to_delete:
        services.pop(name, None)

    with compose_path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False)
    print(f"✓ Updated docker-compose at {compose_path}")


def docker_compose_up(compose_path: Path, project_name: str = "database", remove_orphans: bool = False):
    # Prefer modern Docker Compose plugin; set project name for stack grouping.
    if is_command_available(["docker", "compose", "version"]):
        compose_cmd = ["docker", "compose", "-f", str(compose_path), "-p", project_name, "up", "-d"]
        if remove_orphans:
            compose_cmd.append("--remove-orphans")
    elif is_command_available(["docker-compose", "version"]):
        compose_cmd = ["docker-compose", "-f", str(compose_path), "-p", project_name, "up", "-d"]
        if remove_orphans:
            compose_cmd.append("--remove-orphans")
    else:
        raise RuntimeError("Docker Compose not found. Please install Docker Desktop.")
    run_command(compose_cmd)
    print("✓ Docker containers started (detached)")


def check_docker_daemon() -> bool:
    """Return True if Docker daemon is reachable (docker info succeeds).

    This is a stronger check than merely having the docker command on PATH.
    """
    try:
        res = subprocess.run(["docker", "info"], capture_output=True, text=True, check=False)
        if res.returncode == 0:
            return True
        print("! Docker appears to be installed but the daemon is not reachable.")
        if res.stderr:
            print("Docker stderr:")
            print(res.stderr)
        if res.stdout:
            print("Docker stdout:")
            print(res.stdout)
        return False
    except FileNotFoundError:
        return False


def wait_for_db(host: str, port: int, user: str, password: str, db_name: str, timeout: int = 120):
    ensure_package("psycopg2-binary", "psycopg2")
    import psycopg2  # type: ignore

    print(f"Waiting for PostgreSQL to be ready at {host}:{port} (timeout {timeout}s)…")
    deadline = time.time() + timeout
    last_err = None
    while time.time() < deadline:
        try:
            print("Tentative de connextion à la base")
            conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=db_name)
            # conn = psycopg2.connect(host="localhost", port=5432, user="postgres", password="admin", dbname="cockpit_nap")
            print("ICI")
            conn.close()
            print("✓ PostgreSQL is ready")
            return
        except psycopg2.OperationalError as e:
            last_err = e
            time.sleep(3)
    raise RuntimeError(f"Database did not become ready in time. Last error: {last_err}")


def apply_sql_file(sql_path: Path, host: str, port: int, user: str, password: str, db_name: str):
    ensure_package("psycopg2-binary", "psycopg2")
    import psycopg2  # type: ignore

    print(f"→ Applying SQL: {sql_path}")
    with sql_path.open("r", encoding="utf-8") as f:
        sql_text = f.read()

    conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=db_name)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            # Execute statements one by one to avoid multi-statement issues
            statements = [s.strip() for s in sql_text.split(';') if s.strip()]
            for stmt in statements:
                cur.execute(stmt)
        print(f"✓ Applied {sql_path.name}")
    finally:
        conn.close()


def import_users_from_csv(csv_path: Path, host: str, port: int, user: str, password: str, db_name: str):
    ensure_package("psycopg2-binary", "psycopg2")
    import csv
    import psycopg2  # type: ignore

    if not csv_path.exists():
        print(f"! Skipping user import; file not found: {csv_path}")
        return

    print(f"→ Importing users from {csv_path}")
    conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=db_name)
    try:
        with conn:
            with conn.cursor() as cur:
                with csv_path.open("r", encoding="utf-8") as f:
                    reader = csv.DictReader(f, delimiter=';')
                    rows = list(reader)
                for r in rows:
                    # Convert fields
                    def to_bool(v: str | None):
                        return str(v).strip().lower() in ("1", "true", "t", "yes", "y")

                    cur.execute(
                        """
                        INSERT INTO "DIM_USER" (id_user, first_name, last_name, pseudo, email, password, role, deleted)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id_user) DO NOTHING
                        """,
                        (
                            int(r.get("id_user") or 0) or None,
                            r.get("first_name"),
                            r.get("last_name"),
                            r.get("pseudo"),
                            r.get("email"),
                            r.get("password"),
                            r.get("role"),
                            to_bool(r.get("deleted")),
                        ),
                    )
        print("✓ Imported users")
    finally:
        conn.close()


def import_csvs_from_dir(dir_path: Path, host: str, port: int, user: str, password: str, db_name: str):
    """Generic CSV importer: looks for .csv files in the directory and inserts rows into matching DB tables.

    Mapping rules (filename -> table) are forgiving: filenames like 'services.csv' or 'ref_service.csv'
    will map to the database table "REF_SERVICE". For 'user.csv' or 'users.csv' the target is
    "DIM_USER". The function reads CSV headers (semicolon-delimited) and builds an INSERT using the
    provided columns. If a primary key column is detected (first header starting with 'id_'), an
    ON CONFLICT DO NOTHING clause will be added to avoid duplicate inserts.
    Missing timestamp columns such as 'creation_date' will be filled with the current time if not
    provided in the CSV.
    """
    ensure_package("psycopg2-binary", "psycopg2")
    import csv
    import psycopg2  # type: ignore
    from datetime import datetime

    if not dir_path.exists() or not dir_path.is_dir():
        print(f"! CSV import directory not found: {dir_path}")
        return


    # Simple mapping: filename stem (without extension) is the target table name.
    # Caller must name CSV files to match DB table names (case-insensitive).

    csv_files = list(dir_path.glob("*.csv"))
    if not csv_files:
        print(f"! No CSV files found in {dir_path}")
        return

    conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=db_name)
    try:
        with conn:
            with conn.cursor() as cur:
                for csv_file in csv_files:
                    stem = csv_file.stem
                    # Use the filename stem as the table name (case-insensitive). The DB is expected to have the table.
                    table = stem.upper()
                    print(f"→ Importing CSV {csv_file.name} -> table {table}")

                    with csv_file.open("r", encoding="utf-8") as f:
                        reader = csv.DictReader(f, delimiter=';')
                        rows = list(reader)

                    if not rows:
                        print(f"   - no rows found in {csv_file.name}, skipping")
                        continue

                    # Normalize header names and detect primary key column (heuristic)
                    headers = [h.strip() for h in rows[0].keys()]
                    pk_col = None
                    for h in headers:
                        if h.lower().startswith("id_") or h.lower() == "id":
                            pk_col = h
                            break

                    for r in rows:
                        # Build column list and values; skip empty strings -> NULL
                        cols = []
                        vals = []
                        for h in headers:
                            raw = r.get(h)
                            if raw is None or str(raw).strip() == "":
                                # If column is creation_date and missing, set now()
                                if h == "creation_date":
                                    cols.append('"creation_date"')
                                    vals.append(datetime.utcnow())
                                else:
                                    # include column with NULL value
                                    cols.append(f'"{h}"')
                                    vals.append(None)
                            else:
                                v = raw
                                # convert boolean-ish fields
                                if str(h).lower() in ("deleted",):
                                    v = str(raw).strip().lower() in ("1", "true", "t", "yes", "y")
                                cols.append(f'"{h}"')
                                vals.append(v)

                        col_list = ", ".join(cols)
                        placeholders = ", ".join(["%s"] * len(vals))
                        sql = f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders})'
                        if pk_col:
                            sql += f' ON CONFLICT ("{pk_col}") DO NOTHING'

                        try:
                            cur.execute(sql, tuple(vals))
                        except Exception as e:
                            print(f"   ! Failed to insert row into {table}: {e}")
                            # print the failing row for debugging
                            print(f"     row: {r}")
                            continue
                    print(f"   ✓ Imported {len(rows)} rows into {table}")
    finally:
        conn.close()


def fix_db_sequences(host: str, port: int, user: str, password: str, db_name: str, tables_pk_map: dict | None = None):
    """Ensure sequences for integer primary keys are set to the current max(id) for seeded tables.

    By default this will attempt to fix common tables used by this project. The tables_pk_map
    parameter lets callers provide a custom mapping of table -> pk column name.
    """
    ensure_package("psycopg2-binary", "psycopg2")
    import psycopg2  # type: ignore

    # Default mapping inferred from Prisma schema / project conventions
    default_map = {
        'DIM_USER': 'id_user',
        'DIM_MACHINE': 'id_machine',
        'DIM_SYSTEM': 'id_sys',
        'DIM_WORKER': 'id_worker',
        'REF_SERVICE': 'id_service',
        'REF_TYPE_MACHINE': 'id_type_machine',
        'REF_TYPE_SYSTEM': 'id_type_sys',
        'FCT_VERIF_SYSTEM': 'id_verif',
    }

    mapping = tables_pk_map or default_map

    print(f"→ Fixing DB sequences for seeded tables: {', '.join(mapping.keys())}")
    conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=db_name)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            for table, pk in mapping.items():
                try:
                    # Sequence names often require double-quotes when they contain uppercase letters.
                    # Passing the sequence name as a single-quoted string containing the double-quoted
                    # identifier works reliably, e.g. '"DIM_USER_id_user_seq"'.
                    seq_quoted = f'"{table}_{pk}_seq"'
                    seq_literal = f"'{seq_quoted}'"
                    sql = (
                        f"SELECT setval({seq_literal}, (SELECT COALESCE(MAX(\"{pk}\"), 0) FROM \"{table}\"), true);"
                    )
                    # Execute the setval; if table/sequence doesn't exist, catch and continue
                    cur.execute(sql)
                    print(f"   ✓ Sequence fixed for {table}.{pk}")
                except Exception as e:
                    print(f"   ! Could not fix sequence for {table}.{pk}: {e}")
                    continue
    finally:
        conn.close()


def write_env_file_from_template(template_path: Path, env_path: Path, replacements: dict[str, str]):
    if not template_path.exists():
        raise FileNotFoundError(f"Env template not found: {template_path}")
    content = template_path.read_text(encoding="utf-8")
    # Basic replacements by keys if present; otherwise replace localhost/127.0.0.1
    for key, value in replacements.items():
        # Replace exact key assignment if present (e.g., GLOBAL_IP=.*)
        lines = []
        changed = False
        for line in content.splitlines():
            if line.startswith(f"{key}="):
                lines.append(f"{key}={value}")
                changed = True
            else:
                lines.append(line)
        content = "\n".join(lines)
        if not changed:
            # Fallback to generic replacements
            content = content.replace("127.0.0.1", value).replace("localhost", value)
    env_path.write_text(content, encoding="utf-8")
    print(f"✓ Wrote env file: {env_path}")


def main():
    repo_root = Path(__file__).resolve().parent
    data_dir = repo_root / "data"
    backend_dir = repo_root / "backend"
    frontend_dir = repo_root / "frontend"
    prisma_generated_dir = backend_dir / "prisma" / "generated"

    compose_path = data_dir / "docker-compose.yaml"
    ddl_inspection_path = data_dir / "DDL_COCKPIT.sql"

    # Ask which installation to perform: complete (DB + WEB), web only, or db only.
    print("=== AUAS Web Lab Setup ===")
    print("Choose installation mode:")
    print("  1) complete  - Install both Database (Docker) and Web (backend+frontend)")
    print("  2) web       - Install only Web (backend + frontend)")
    print("  3) db        - Install only Database (Docker + data)")

    choice = None
    valid_map = {"1": "complete", "2": "web", "3": "db", "complete": "complete", "web": "web", "db": "db"}
    while choice not in valid_map:
        raw = input("Select option [1/2/3] (default 1): ").strip() or "1"
        val = valid_map.get(raw.lower())
        if val:
            choice = val
        else:
            print("Invalid choice. Please enter 1, 2 or 3 (or 'complete','web','db').")

    install_db = choice in ("complete", "db")
    install_web = choice in ("complete", "web")

    # Collect DB-related inputs if either DB or WEB needs DB info
    ip_addr = None
    db_user = db_password = db_name = None
    host_port = None
    if install_db or install_web:
        ip_addr = prompt_with_default("Enter the IP address of this device", default="localhost")
        db_user = prompt_with_default("PostgreSQL user", default="postgres")
        db_password = prompt_with_default("PostgreSQL password", default="admin", secret=True)
        db_name = prompt_with_default("PostgreSQL database name", default="cockpit_nap")
        host_port_str = prompt_with_default("Host port to expose PostgreSQL (maps to container 5432)", default="5432")
        try:
            host_port = int(host_port_str)
        except ValueError as exc:
            raise SystemExit("Host port must be a number, e.g., 5432") from exc

    # If DB installation requested, run DB steps
    if install_db:
        # Ask for container (service) name and volume name to use in docker-compose
        default_svc = "postgres_nap"
        default_vol = "pgdata1"
        svc_name = prompt_with_default("Docker service name for Postgres (container name)", default=default_svc)
        volume_name = prompt_with_default("Docker volume name for Postgres data", default=default_vol)

        # If docker is available, check whether a container or volume with those names already exists
        docker_available = is_command_available(["docker", "--version"]) or is_command_available(["docker", "version"])
        if docker_available:
            # Do a quick daemon availability check; if the daemon isn't running we must abort
            if not check_docker_daemon():
                print("Cannot reach Docker daemon. Please start Docker Desktop (or the Docker daemon) and try again.")
                return
            # Check existing containers and volumes
            try:
                existing_containers = subprocess.run(["docker", "ps", "-a", "--format", "{{.Names}}"], capture_output=True, text=True, check=False).stdout.splitlines()
            except Exception:
                existing_containers = []
            try:
                existing_volumes = subprocess.run(["docker", "volume", "ls", "-q"], capture_output=True, text=True, check=False).stdout.splitlines()
            except Exception:
                existing_volumes = []

            if svc_name in existing_containers or volume_name in existing_volumes:
                print(f"Detected existing resources: container={svc_name if svc_name in existing_containers else '-'} volume={volume_name if volume_name in existing_volumes else '-'}")
                replace = prompt_with_default("One or more resources already exist. Replace them? (yes/no)", default="no")
                if replace.strip().lower() in ("y", "yes"):
                    # remove container if exists
                    if svc_name in existing_containers:
                        print(f"Removing existing container {svc_name}...")
                        run_command(["docker", "rm", "-f", svc_name], check=False)
                    # remove volume if exists
                    if volume_name in existing_volumes:
                        print(f"Removing existing volume {volume_name}...")
                        run_command(["docker", "volume", "rm", "-f", volume_name], check=False)
                else:
                    print("Aborting installation as requested by user (will not replace existing container/volume).")
                    return
        else:
            print("Warning: Docker not found on PATH; continuing but resource existence cannot be checked.")

        # 2) Update docker-compose
        update_docker_compose(compose_path, db_user, db_password, db_name, host_port, svc_name, volume_name)

        # 3) Start Docker Compose under the 'database' stack.
        docker_compose_up(compose_path, project_name="database", remove_orphans=False)

        # 4) Wait for DB
        wait_for_db(ip_addr, host_port, db_user, db_password, db_name, timeout=150)

        # 5) Apply DDLs
        apply_sql_file(ddl_inspection_path, ip_addr, host_port, db_user, db_password, db_name)

    # 6) Seed CSVs from example_data (users + referentials)
    example_data_dir = data_dir / "example_data"
    import_csvs_from_dir(example_data_dir, ip_addr, host_port, db_user, db_password, db_name)
    # After seeding CSVs, ensure DB sequences are aligned with imported IDs so future inserts do not
    # conflict with existing primary keys. This mirrors the 'fixUserIdSequence' logic used elsewhere.
    try:
        fix_db_sequences(ip_addr, host_port, db_user, db_password, db_name)
    except Exception as e:
        print(f"Warning: failed to fix DB sequences automatically: {e}")

    # If WEB installation requested, run backend + frontend steps
    if install_web:
        # Ensure we have DB connection values (either from above or prompt now)
        if not (ip_addr and db_user and db_password and db_name and host_port):
            ip_addr = prompt_with_default("Enter the IP address of the database host", default="localhost")
            db_user = prompt_with_default("PostgreSQL user", default="postgres")
            db_password = prompt_with_default("PostgreSQL password", default="admin", secret=True)
            db_name = prompt_with_default("PostgreSQL database name", default="lab_inspection")
            host_port_str = prompt_with_default("Host port to reach PostgreSQL", default="5432")
            try:
                host_port = int(host_port_str)
            except ValueError as exc:
                raise SystemExit("Host port must be a number, e.g., 5432") from exc

        # 7) Backend setup
        backend_env_tmpl = backend_dir / ".env_template"
        backend_env = backend_dir / ".env"
        # Construct DB URL for backend
        db_url = f"postgresql://{db_user}:{db_password}@{ip_addr}:{host_port}/{db_name}?schema=public"
        backend_replacements = {
            "GLOBAL_IP": ip_addr,
            "DATABASE_URL_PSQL": db_url,
            "FRONTEND_URL": f"http://{ip_addr}:4000",
        }
        write_env_file_from_template(backend_env_tmpl, backend_env, backend_replacements)

        print("→ Installing backend dependencies (npm install)…")
        npm_cmd = resolve_command(["npm", "npm.cmd", "npm.exe"])  # Robust Windows support
        run_command(npm_cmd + ["install"], cwd=backend_dir, check=True)

        print("→ Prisma: pulling DB schema…")
        npx_cmd = resolve_command(["npx", "npx.cmd", "npx.exe"])  # Robust Windows support
        run_command(npx_cmd + ["prisma", "db", "pull", "--schema=./prisma/schema_psql.prisma"], cwd=backend_dir, check=True)

        # Remove previously generated Prisma client (best-effort), then generate with a simple retry on EPERM.
        if prisma_generated_dir.exists():
            print(f"→ Removing existing Prisma generated directory to avoid EPERM issues: {prisma_generated_dir}")
            remove_dir_simple(prisma_generated_dir)
        print("→ Prisma: generating client (fresh)…")
        gen_cmd = npx_cmd + ["prisma", "generate", "--schema=./prisma/schema_psql.prisma"]
        # First try
        res = subprocess.run(gen_cmd, cwd=str(backend_dir), text=True, capture_output=True)
        if res.returncode != 0:
            out = (res.stdout or "") + "\n" + (res.stderr or "")
            if "EPERM: operation not permitted, rename" in out:
                print("! Prisma EPERM during generate; retrying once after cleanup…")
                remove_dir_simple(prisma_generated_dir)
                time.sleep(1.0)
                res2 = subprocess.run(gen_cmd, cwd=str(backend_dir))
                if res2.returncode != 0:
                    raise RuntimeError(f"Prisma generate failed with exit code {res2.returncode}")
            else:
                # show logs to help troubleshooting
                if res.stdout:
                    print(res.stdout)
                if res.stderr:
                    print(res.stderr)
                raise RuntimeError(f"Prisma generate failed with exit code {res.returncode}")

        # 8) Frontend setup
        frontend_env_tmpl = frontend_dir / ".env_template"
        frontend_env = frontend_dir / ".env"
        frontend_replacements = {
            "REACT_APP_API_URL": f"http://{ip_addr}:3000",
            "REACT_APP_API_BASE_URL": f"http://{ip_addr}:3000/api",
            "HOST": ip_addr if ip_addr != "127.0.0.1" else "0.0.0.0",
        }
        write_env_file_from_template(frontend_env_tmpl, frontend_env, frontend_replacements)

        print("→ Installing frontend dependencies (npm install)…")
        run_command(npm_cmd + ["install"], cwd=frontend_dir, check=True)

    print("\nSetup completed successfully!")
    if install_db:
        print("- Database running in Docker on port:", host_port)
    if install_web:
        print(f"- Backend .env at {backend_env}")
        print(f"- Frontend .env at {frontend_env}")
    print("You can now start the backend and frontend using your existing scripts.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted by user.")
        sys.exit(1)
    except Exception as e:  # noqa: BLE001 - top-level guard to show a friendly error
        print(f"\nSetup failed: {e}")
        sys.exit(1)
