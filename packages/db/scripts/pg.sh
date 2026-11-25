#!/usr/bin/env bash
# Starts a throwaway Postgres with all migrations applied and prints DATABASE_URL.
# Usage: eval "$(bash scripts/pg.sh start)"  …  bash scripts/pg.sh stop
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin | tail -1)}"
PORT="${PGPORT:-55433}"
STATE=/tmp/shulife-pg-$PORT
run() { su postgres -s /bin/bash -c "$*"; }
if [ "${1:-}" = "stop" ]; then run "$PGBIN/pg_ctl -D $STATE/data -m fast stop" >/dev/null 2>&1 || true; rm -rf "$STATE"; exit 0; fi
rm -rf "$STATE"; mkdir -p "$STATE/data" "$STATE/sql"; cp "$DIR"/local/*.sql "$DIR"/migrations/*.sql "$STATE/sql/"; chown -R postgres "$STATE"
run "$PGBIN/initdb -D $STATE/data -A trust -U postgres" >/dev/null
run "$PGBIN/pg_ctl -D $STATE/data -o '-p $PORT -k /tmp -c max_connections=200' -l $STATE/log -w start" >/dev/null
run "$PGBIN/psql -h /tmp -p $PORT -U postgres -q -c 'create database shulife'"
for f in $(ls "$STATE"/sql/*.sql | sort); do run "$PGBIN/psql -h /tmp -p $PORT -U postgres -d shulife -q -v ON_ERROR_STOP=1 -f $f" >/dev/null 2>&1 || { echo "migration failed: $f" >&2; exit 1; }; done
echo "export DATABASE_URL=postgres://postgres@localhost:$PORT/shulife"
