#!/usr/bin/env bash
# Start / stop a private copy of the contract stack per worker, so parallel work never shares state or a lock.
# Usage: scripts/worker-stack.sh up|down|ports <worker-id>
# Config (env):
#   COMPOSE_FILE_PATH  compose file of the stack (default: contract/docker-compose.yml)
#   PORT_OFFSET_STEP   port offset per worker number (default: 100)
#   PORT_VARS          space-separated env var names the compose file reads for host ports (default: SERVICE_PORT)
# The compose file must read its host ports from env vars (e.g. "${SERVICE_PORT:-12001}:12001").
set -euo pipefail

cmd=${1:?up|down|ports}; worker=${2:?worker id (number)}
compose=${COMPOSE_FILE_PATH:-contract/docker-compose.yml}
step=${PORT_OFFSET_STEP:-100}
vars=${PORT_VARS:-SERVICE_PORT}
project="port-w${worker}"
offset=$(( worker * step ))

# each var keeps its compose default plus the worker offset
for v in $vars; do
  default=$(grep -oE "\\\$\{$v:-[0-9]+\}" "$compose" | head -1 | grep -oE '[0-9]+$' || true)
  [ -z "$default" ] && { echo "no default for \${$v:-…} in $compose" >&2; exit 1; }
  export "$v=$(( default + offset ))"
done

case "$cmd" in
  up)    docker compose -p "$project" -f "$compose" up -d ;;
  down)  docker compose -p "$project" -f "$compose" down -v ;;
  ports) for v in $vars; do echo "$v=${!v}"; done ;;
  *)     echo "unknown command $cmd" >&2; exit 2 ;;
esac
