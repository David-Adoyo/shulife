#!/usr/bin/env bash
# Applies the migrations to a throwaway local Postgres and runs the RLS tests.
# Usage: bash scripts/test.sh   (needs postgresql installed; runs as the postgres user)
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin | tail -1)}"
DATA="$(mktemp -d /tmp/shulife-pg.XXXXXX)"
PORT="${PGPORT:-55432}"
WORK="$(mktemp -d /tmp/shulife-sql.XXXXXX)"
cp -r "$DIR/local" "$DIR/migrations" "$DIR/test" "$WORK/"
chown -R postgres "$DATA" "$WORK"
run() { su postgres -s /bin/bash -c "$*"; }
cleanup() { run "$PGBIN/pg_ctl -D $DATA -m immediate stop" >/dev/null 2>&1 || true; rm -rf "$DATA" "$WORK"; }
trap cleanup EXIT
run "$PGBIN/initdb -D $DATA -A trust -U postgres" >/dev/null
run "$PGBIN/pg_ctl -D $DATA -o '-p $PORT -k /tmp' -l $DATA/log -w start" >/dev/null
PSQL="$PGBIN/psql -h /tmp -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
run "$PSQL -c 'create database shulife_test'"
for f in "$WORK"/local/*.sql "$WORK"/migrations/*.sql; do
  echo "→ $(basename "$f")"
  run "$PSQL -d shulife_test -f $f"
done
run "$PSQL -d shulife_test -f $WORK/test/rls.test.sql" 2>&1 | sed -n 's/.*NOTICE:  //p; /PASSED/p; /ERROR/p'
