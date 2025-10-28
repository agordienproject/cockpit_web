import sys
import time
import getpass
import subprocess
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


def update_docker_compose(compose_path: Path, db_user: str, db_password: str, db_name: str, host_port: int):
    ensure_package("pyyaml", "yaml")
    import yaml  # type: ignore

    with compose_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    # Defensive defaults
    data = data or {}
    services = data.setdefault("services", {})
    # Try to find an existing Postgres service by image name
    svc_name = None
    for name, svc_def in services.items():
        if isinstance(svc_def, dict):
            img = svc_def.get("image", "")
            if isinstance(img, str) and img.lower().startswith("postgres"):
                svc_name = name
                break
    if not svc_name:
        svc_name = "postgres_db_lab"
    svc = services.setdefault(svc_name, {})

    # Ensure required fields for a valid service
    if not svc.get("image"):
        svc["image"] = "postgres:latest"
    svc.setdefault("restart", "always")

    env = svc.setdefault("environment", {})
    env["POSTGRES_USER"] = db_user
    env["POSTGRES_PASSWORD"] = db_password
    env["POSTGRES_DB"] = db_name

    # ports: list of strings like "HOST:CONTAINER"
    svc["ports"] = [f"{host_port}:5432"]

    # volumes: ensure a named volume exists
    if not svc.get("volumes"):
        svc["volumes"] = ["pgdata1:/var/lib/postgresql/data"]

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

    compose_path = data_dir / "docker-compose.yaml"
    ddl_inspection_path = data_dir / "DDL_COCKPIT.sql"
    users_csv_path = data_dir / "example_data" / "user.csv"

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
        db_name = prompt_with_default("PostgreSQL database name", default="lab_inspection")
        host_port_str = prompt_with_default("Host port to expose PostgreSQL (maps to container 5432)", default="5432")
        try:
            host_port = int(host_port_str)
        except ValueError as exc:
            raise SystemExit("Host port must be a number, e.g., 5432") from exc

    # If DB installation requested, run DB steps
    if install_db:
        # 2) Update docker-compose
        update_docker_compose(compose_path, db_user, db_password, db_name, host_port)

        # 3) Start Docker Compose under the 'database' stack.
        docker_compose_up(compose_path, project_name="database", remove_orphans=False)

        # 4) Wait for DB
        wait_for_db(ip_addr, host_port, db_user, db_password, db_name, timeout=150)

        # 5) Apply DDLs
        apply_sql_file(ddl_inspection_path, ip_addr, host_port, db_user, db_password, db_name)

        # 6) Seed users from CSV
        import_users_from_csv(users_csv_path, ip_addr, host_port, db_user, db_password, db_name)

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
            "FTP_HOST": ip_addr,
        }
        write_env_file_from_template(backend_env_tmpl, backend_env, backend_replacements)

        print("→ Installing backend dependencies (npm install)…")
        npm_cmd = resolve_command(["npm", "npm.cmd", "npm.exe"])  # Robust Windows support
        run_command(npm_cmd + ["install"], cwd=backend_dir, check=True)

        print("→ Prisma: pulling DB schema…")
        npx_cmd = resolve_command(["npx", "npx.cmd", "npx.exe"])  # Robust Windows support
        run_command(npx_cmd + ["prisma", "db", "pull", "--schema=./prisma/schema_psql.prisma"], cwd=backend_dir, check=True)

        print("→ Prisma: generating client…")
        run_command(npx_cmd + ["prisma", "generate", "--schema=./prisma/schema_psql.prisma"], cwd=backend_dir, check=True)

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
