#!/usr/bin/env bash
# Bootstrap PostgreSQL local (sin Docker) compatible con Domo.
# Uso: bash scripts/bootstrap-local-postgres.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${POSTGRES_PORT:-5432}"
USER_NAME="${POSTGRES_USER:-erp}"
PASSWORD="${POSTGRES_PASSWORD:-erp}"
DB_NAME="${POSTGRES_DB:-erp_saas}"

if ! command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL no está instalado."
  echo "  Ubuntu/Debian: sudo apt-get install -y postgresql postgresql-contrib"
  echo "  macOS:         brew install postgresql@16 && brew services start postgresql@16"
  echo "  O instala Docker y usa: docker compose up -d postgres"
  exit 1
fi

if command -v pg_isready >/dev/null 2>&1; then
  if ! pg_isready -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
    if command -v service >/dev/null 2>&1; then
      sudo service postgresql start || true
    elif command -v brew >/dev/null 2>&1; then
      brew services start postgresql@16 2>/dev/null || brew services start postgresql || true
    fi
  fi
  pg_isready -h 127.0.0.1 -p "$PORT"
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${USER_NAME}') THEN
    CREATE ROLE ${USER_NAME} LOGIN PASSWORD '${PASSWORD}';
  ELSE
    ALTER ROLE ${USER_NAME} WITH LOGIN PASSWORD '${PASSWORD}';
  END IF;
END\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${USER_NAME}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${USER_NAME};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${USER_NAME};
ALTER SCHEMA public OWNER TO ${USER_NAME};
SQL

ENV_FILE="$ROOT/.env"
EXAMPLE="$ROOT/.env.example"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$EXAMPLE" "$ENV_FILE"
  echo "Creado .env desde .env.example"
fi

URL="postgresql://${USER_NAME}:${PASSWORD}@localhost:${PORT}/${DB_NAME}?schema=public"
# Actualiza solo las URLs de DB locales de ejemplo / previas
if grep -q '^DATABASE_URL=' "$ENV_FILE"; then
  sed -i.bak -E "s|^DATABASE_URL=.*|DATABASE_URL=${URL}|" "$ENV_FILE"
  sed -i.bak -E "s|^DATABASE_DIRECT_URL=.*|DATABASE_DIRECT_URL=${URL}|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
else
  printf '\nDATABASE_URL=%s\nDATABASE_DIRECT_URL=%s\n' "$URL" "$URL" >> "$ENV_FILE"
fi

echo "OK — DB lista en localhost:${PORT}/${DB_NAME}"
echo "Siguiente: npm run prisma:migrate:deploy"
