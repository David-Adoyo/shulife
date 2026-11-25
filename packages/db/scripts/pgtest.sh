#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(bash scripts/pg.sh start)"
trap 'bash scripts/pg.sh stop' EXIT
npx vitest run --testTimeout=120000
