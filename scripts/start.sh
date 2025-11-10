#!/usr/bin/env bash
# Start backend (db + web) and optionally frontend dev server for local development
# Usage: ./scripts/start.sh    (starts backend + frontend)
#        NO_FRONTEND=1 ./scripts/start.sh   (start backend only)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT/backend"

echo "Starting Postgres..."
docker-compose up -d db
# wait for Postgres readiness
echo "Waiting for Postgres to be ready..."
DB_USER="${POSTGRES_USER:-myprojectuser}"
until docker-compose exec -T db pg_isready -U "$DB_USER" >/dev/null 2>&1; do
  printf '.'
  sleep 1
done
printf "\nPostgres is ready.\n"

echo "Starting web service..."
docker-compose up -d web

# run migrations
echo "Applying Django migrations..."
docker-compose exec web python manage.py migrate --noinput

# Optionally start frontend dev server
if [ "${NO_FRONTEND:-0}" != "1" ]; then
  echo "Starting frontend dev server..."
  cd "$PROJECT_ROOT"
  if [ ! -d node_modules ]; then
    echo "Installing frontend dependencies (npm install)..."
    npm install
  fi
  # run in background so the script can finish
  npm run serve &
  echo "Frontend dev server started (background)."
fi

echo "All services started. Backend accessible at http://localhost:8000, frontend at http://localhost:8080 (if started)."
