#!/usr/bin/env bash
set -euo pipefail

help() {
  cat <<'HLP'
Props local bootstrap
Usage: ./run-local.sh [--check] [--no-build] [--native] [--db-url <url>] [--start-db] [--prisma-insecure]
  --check     : Only run prerequisite checks, no containers started
  --no-build  : (docker mode) Skip docker build, just up existing images
  --native    : Skip docker; use local Node/Postgres (DATABASE_URL must be valid)
  --db-url    : Override DATABASE_URL for this run (native mode)
  --start-db  : In native mode, start docker compose `db` service and map to localhost:5432
  --prisma-insecure : Allow TLS-insecure Prisma engine download (only if corp proxy blocks CA)
  -h|--help   : Show this help

Default: use docker if available; if docker missing, require --native.
HLP
}

CHECK_ONLY=false
NO_BUILD=false
NATIVE=false
PRISMA_INSECURE=false
DB_URL_OVERRIDE=""
START_DB=false
while [[ ${1:-} ]]; do
  case "$1" in
    --check) CHECK_ONLY=true ;;
    --no-build) NO_BUILD=true ;;
    --native) NATIVE=true ;;
    --db-url) shift; DB_URL_OVERRIDE="${1:-}"; if [[ -z "$DB_URL_OVERRIDE" ]]; then echo "[!] --db-url requires a value"; exit 1; fi ;;
    --start-db) START_DB=true ;;
    --prisma-insecure) PRISMA_INSECURE=true ;;
    -h|--help) help; exit 0 ;;
    *) echo "[!] Unknown flag: $1" >&2; help; exit 1 ;;
  esac
  shift
done

cmd_exists() { command -v "$1" >/dev/null 2>&1; }

# Docker Desktop on macOS is often missing from PATH in minimal shells (e.g. some IDE terminals).
augment_path_for_docker() {
  cmd_exists docker && return 0
  local dir
  for dir in \
    "/usr/local/bin" \
    "/opt/homebrew/bin" \
    "${HOME}/.docker/bin" \
    "/Applications/Docker.app/Contents/Resources/bin"; do
    if [[ -x "${dir}/docker" ]]; then
      PATH="${dir}:${PATH}"
      export PATH
      echo "[*] Prepended Docker CLI to PATH: ${dir}"
      return 0
    fi
  done
  return 1
}

if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "$HOME/.nvm/nvm.sh"
fi

# Prefer Node 22 when available because Prisma in this repo breaks under older shells on some setups.
if cmd_exists node && [[ -n "${NVM_DIR:-}" || -f "$HOME/.nvm/nvm.sh" ]] && command -v nvm >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/^v//')
  MAJ=${NODE_VER%%.*}
  if (( MAJ < 22 )) && nvm ls 22 >/dev/null 2>&1; then
    nvm use 22 >/dev/null
    echo "[*] Switched Node runtime to $(node -v) via nvm"
  fi
fi

# Node check (only warn)
if cmd_exists node; then
  NODE_VER=$(node -v | sed 's/^v//')
  MAJ=${NODE_VER%%.*}
  if (( MAJ < 22 )); then
    echo "[!] Node >=22 recommended. Current: v$NODE_VER" >&2
  else
    echo "[*] Node version OK: v$NODE_VER"
  fi
fi

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    echo "[!] .env was missing. Created from .env.example; please edit required secrets and rerun." >&2
  else
    echo "[!] .env missing and .env.example not found. Create .env first." >&2
  fi
  exit 1
fi

augment_path_for_docker || true

# Decide mode
if ! $NATIVE; then
  if cmd_exists docker; then
    DOCKER_PRESENT=true
  else
    echo "[!] Docker not found. Re-run with --native (requires local Postgres & DATABASE_URL)." >&2
    exit 1
  fi
else
  DOCKER_PRESENT=false
fi

if $CHECK_ONLY; then
  echo "[✓] Checks complete. Mode: $([ "$NATIVE" = true ] && echo native || echo docker)"; exit 0
fi

if $DOCKER_PRESENT; then
  DC_CMD="docker compose"
  if ! $DC_CMD version >/dev/null 2>&1; then
    if cmd_exists docker-compose; then
      DC_CMD="docker-compose"
    else
      echo "[!] docker compose/docker-compose not found." >&2; exit 1
    fi
  fi
  echo "[*] Using compose command: $DC_CMD"
  if $NO_BUILD; then
    echo "[1/4] Starting containers (no build)..."; $DC_CMD up -d
  else
    echo "[1/4] Building and starting containers..."; $DC_CMD up --build -d
  fi
  if $PRISMA_INSECURE; then
    PRISMA_ENV="NODE_TLS_REJECT_UNAUTHORIZED=0"
    echo "[!] --prisma-insecure set. Prisma engine download will ignore TLS validation (not for production)."
  else
    PRISMA_ENV=""
  fi
  echo "[2/4] Running Prisma generate..."; $DC_CMD exec backend env $PRISMA_ENV npm run prisma:generate
  echo "[3/4] Applying migrations..."; $DC_CMD exec backend env $PRISMA_ENV npx prisma migrate dev --name init
  echo "[4/4] Seeding roles..."; $DC_CMD exec backend npx ts-node prisma/seed.ts
  echo "All set. Web: http://localhost:3000  API: http://localhost:4000"
else
  # load env file
  set -a; source .env; set +a
  if [[ -n "$DB_URL_OVERRIDE" ]]; then
    export DATABASE_URL="$DB_URL_OVERRIDE"
    echo "[*] Using DATABASE_URL override."
  fi
  echo "[*] Native mode. Requires DATABASE_URL reachable (Postgres running)."
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "[!] DATABASE_URL not set; use --db-url or edit .env then re-run." >&2; exit 1
  fi
  if [[ "$DATABASE_URL" == *"@db:"* ]]; then
    echo "[!] DATABASE_URL points to docker host 'db:5432'. For native mode set it to localhost (e.g. postgresql://user:pass@localhost:5432/props) or pass --db-url." >&2
    exit 1
  fi
  # Node/Prisma on macOS often resolve "localhost" to ::1; Docker Postgres listens on IPv4 — use 127.0.0.1.
  if [[ "$DATABASE_URL" == *"@localhost:"* ]]; then
    DATABASE_URL="${DATABASE_URL/@localhost:/@127.0.0.1:}"
    export DATABASE_URL
    echo "[*] Normalized DB host localhost -> 127.0.0.1 (avoids IPv6 ::1 vs IPv4 listener issues)."
  elif [[ "$DATABASE_URL" == *"postgresql://localhost:"* ]] || [[ "$DATABASE_URL" == *"postgres://localhost:"* ]]; then
    DATABASE_URL="${DATABASE_URL//postgresql:\/\/localhost:/postgresql:\/\/127.0.0.1:}"
    DATABASE_URL="${DATABASE_URL//postgres:\/\/localhost:/postgres:\/\/127.0.0.1:}"
    export DATABASE_URL
    echo "[*] Normalized DB host localhost -> 127.0.0.1 (avoids IPv6 ::1 vs IPv4 listener issues)."
  fi
  if $START_DB; then
    if ! cmd_exists docker; then
      echo "[!] --start-db needs the Docker CLI on your PATH (docker compose up -d db)." >&2
      echo "    This shell does not see \`docker\`. Typical fixes:" >&2
      echo "    - Install Docker Desktop (https://docs.docker.com/desktop/), open it, wait until it is running." >&2
      echo "    - Run \`docker version\` in this same terminal; if that fails, fix PATH or restart the terminal." >&2
      echo "    - Or skip --start-db and run Postgres yourself (Homebrew, etc.), then use --db-url." >&2
      exit 1
    fi
    DC_CMD="docker compose"
    if ! $DC_CMD version >/dev/null 2>&1; then
      if cmd_exists docker-compose; then DC_CMD="docker-compose"; else echo "[!] docker compose/docker-compose not found." >&2; exit 1; fi
    fi
    echo "[*] Starting docker db service and mapping to localhost:5432 ..."
    if ! $DC_CMD up -d db; then
      echo "[!] docker compose up -d db failed. Is port 5432 already in use? (lsof -i :5432)" >&2
      exit 1
    fi
    echo "    Waiting for Postgres on 127.0.0.1:5432 ..."
    ready=false
    for _ in {1..45}; do
      if $DC_CMD exec -T db pg_isready -U postgres >/dev/null 2>&1; then ready=true; break; fi
      if cmd_exists pg_isready && pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then ready=true; break; fi
      if cmd_exists nc && nc -z 127.0.0.1 5432 >/dev/null 2>&1; then ready=true; break; fi
      sleep 1
    done
    if [[ "$ready" != true ]]; then
      echo "[!] Postgres not reachable on 127.0.0.1:5432 after wait." >&2
      echo "    docker compose ps / logs db:" >&2
      $DC_CMD ps -a db 2>&1 | sed 's/^/    /' >&2 || true
      $DC_CMD logs db --tail 25 2>&1 | sed 's/^/    /' >&2 || true
      exit 1
    fi
  fi
  # Preflight TCP before Prisma (clearer than Prisma P1001)
  DB_CHK_HOST="127.0.0.1"
  DB_CHK_PORT="5432"
  if [[ "$DATABASE_URL" =~ @([^:]+):([0-9]+)(/|\?) ]]; then
    DB_CHK_HOST="${BASH_REMATCH[1]}"
    DB_CHK_PORT="${BASH_REMATCH[2]}"
  elif [[ "$DATABASE_URL" =~ @([^/]+)/ ]]; then
    DB_CHK_HOST="${BASH_REMATCH[1]}"
  fi
  if cmd_exists nc; then
    if ! nc -z "$DB_CHK_HOST" "$DB_CHK_PORT" >/dev/null 2>&1; then
      echo "[!] Nothing is accepting TCP on ${DB_CHK_HOST}:${DB_CHK_PORT} (nc check)." >&2
      echo "    Start Postgres, use --start-db with Docker running, or fix --db-url." >&2
      exit 1
    fi
  elif cmd_exists pg_isready; then
    if ! pg_isready -h "$DB_CHK_HOST" -p "$DB_CHK_PORT" >/dev/null 2>&1; then
      echo "[!] Postgres does not respond on ${DB_CHK_HOST}:${DB_CHK_PORT} (pg_isready)." >&2
      echo "    Start Postgres or use --start-db (Docker required)." >&2
      exit 1
    fi
  fi
  pushd api >/dev/null
  npm install
  if $PRISMA_INSECURE; then
    export NODE_TLS_REJECT_UNAUTHORIZED=0
    echo "[!] --prisma-insecure set. Prisma engine download will ignore TLS validation (not for production)."
  fi
  PRISMA_ENV=("env" "DATABASE_URL=${DATABASE_URL}")
  ${PRISMA_ENV[@]} npm run prisma:generate
  ${PRISMA_ENV[@]} npx prisma migrate dev --name init
  ${PRISMA_ENV[@]} npx ts-node --esm prisma/seed.ts
  PORT=${PORT:-4000} DATABASE_URL=${DATABASE_URL} npm run dev > ../.logs_api.txt 2>&1 &
  API_PID=$!
  popd >/dev/null
  pushd web >/dev/null
  npm install
  npm run dev -- --hostname 0.0.0.0 --port 3000 > ../.logs_web.txt 2>&1 &
  WEB_PID=$!
  popd >/dev/null
  echo "Started native dev servers (background). API PID: $API_PID, WEB PID: $WEB_PID"
  echo "Logs: .logs_api.txt and .logs_web.txt"
  echo "Web: http://localhost:3000  API: http://localhost:4000"
  echo "(Stop with: kill $API_PID $WEB_PID)"
fi
