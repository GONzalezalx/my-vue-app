#!/usr/bin/env bash
# Stop and optionally remove backend containers
# Usage: ./scripts/stop.sh     (stops and removes containers but keeps volumes)
#        ./scripts/stop.sh --remove-volumes   (also remove volumes - destructive)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT/backend"

REMOVE_VOLUMES=0
if [ "${1:-}" = "--remove-volumes" ]; then
  REMOVE_VOLUMES=1
fi

echo "Stopping and removing containers..."
if [ $REMOVE_VOLUMES -eq 1 ]; then
  docker-compose down -v
else
  docker-compose down
fi

echo "Stopping frontend dev server if running..."
pkill -f "vue-cli-service serve" || true
kill $(lsof -ti :8080) || true

echo "All stopped."
