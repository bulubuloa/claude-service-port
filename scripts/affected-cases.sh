#!/usr/bin/env bash
# List the contract case files affected by the current change, so only those run while working.
# Usage: scripts/affected-cases.sh [base-ref]   (default base: origin/HEAD)
# Config (env):
#   CASES_DIR   folder of case files (default: contract)
#   CASE_MAP    file of "<path-glob> <case-glob>" lines mapping source paths to cases (default: $CASES_DIR/case-map.txt)
# Without a map entry, a changed file maps to cases whose path contains its base name (kebab-case).
set -euo pipefail

base=${1:-origin/HEAD}
cases_dir=${CASES_DIR:-contract}
map=${CASE_MAP:-$cases_dir/case-map.txt}

changed=$(git diff --name-only "$base"...HEAD; git diff --name-only; git diff --name-only --cached)
[ -z "$changed" ] && { echo "no changes against $base" >&2; exit 0; }

kebab() { echo "$1" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'; }

{
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in "$cases_dir"/*.json) echo "$file"; continue ;; esac
    hit=
    if [ -f "$map" ]; then
      while read -r pglob cglob; do
        [ -z "${pglob:-}" ] && continue
        case "$pglob" in \#*) continue ;; esac
        # shellcheck disable=SC2053
        if [[ "$file" == $pglob ]]; then
          compgen -G "$cases_dir/$cglob" || true
          hit=1
        fi
      done < "$map"
    fi
    if [ -z "$hit" ]; then
      name=$(kebab "$(basename "${file%.*}")")
      find "$cases_dir" -name '*.json' -path "*${name}*" 2>/dev/null || true
    fi
  done <<< "$changed"
} | sed "s#^$cases_dir/##" | sort -u
