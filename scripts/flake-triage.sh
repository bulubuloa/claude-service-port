#!/usr/bin/env bash
# Re-run failed contract cases in isolation and split them into real failures and timing flakes.
# Usage: scripts/flake-triage.sh <failed-ids-file> [runs]
#   <failed-ids-file>: one "<case-file>#<case-name>" (or "<case-file>") per line
# Config (env):
#   RUN_CASES  command that runs the given case files and exits non-zero on failure
#              (default: "./baseline.sh verify dotnet"), run from CASES_DIR
#   CASES_DIR  folder the command runs in (default: contract)
set -euo pipefail

list=${1:?file with failed case ids}; runs=${2:-3}
run=${RUN_CASES:-./baseline.sh verify dotnet}
dir=${CASES_DIR:-contract}

real=(); flaky=()
while IFS= read -r id; do
  [ -z "$id" ] && continue
  file=${id%%#*}
  pass=0
  for _ in $(seq 1 "$runs"); do
    if (cd "$dir" && $run "$file" >/dev/null 2>&1); then pass=$((pass + 1)); fi
  done
  if [ "$pass" -eq "$runs" ]; then flaky+=("$id (passed $pass/$runs alone)")
  elif [ "$pass" -eq 0 ]; then real+=("$id (failed $runs/$runs alone)")
  else flaky+=("$id (passed $pass/$runs alone, intermittent)"); fi
done < "$list"

echo "real failures:"; for x in "${real[@]:-}"; do [ -n "$x" ] && echo "  $x"; done
echo "timing flakes (fix the case to wait for a condition):"; for x in "${flaky[@]:-}"; do [ -n "$x" ] && echo "  $x"; done
[ "${#real[@]}" -eq 0 ] || [ -z "${real[0]:-}" ]
