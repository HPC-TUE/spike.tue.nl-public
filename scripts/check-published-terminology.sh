#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  printf 'Usage: %s SITE_DIRECTORY\n' "$0" >&2
  exit 64
fi

docs_dir="$1/src/content/docs"
if [ ! -d "$docs_dir" ]; then
  printf 'Published documentation directory not found: %s\n' "$docs_dir" >&2
  exit 66
fi

scan_forbidden() {
  local target="$1"
  local label="$2"
  if command -v rg >/dev/null 2>&1; then
    if rg -n -i --glob '*.md' --glob '*.mdx' --glob '*.html' \
      '\bdocker\b|docker[[:space:]]+desktop|docker[[:space:]]+compose' "$target"; then
      printf 'Blocked terminology found in %s. Use the approved Podman workflow.\n' "$label" >&2
      exit 1
    fi
  else
    if grep -r -n -i -E --include='*.md' --include='*.mdx' --include='*.html' \
      '\bdocker\b|docker[[:space:]]+desktop|docker[[:space:]]+compose' "$target"; then
      printf 'Blocked terminology found in %s. Use the approved Podman workflow.\n' "$label" >&2
      exit 1
    fi
  fi
}

scan_forbidden "$docs_dir" "authored documentation"

for output_dir in "$1/dist" "$1/public"; do
  if [ -d "$output_dir" ] && [ -f "$output_dir/404.html" ]; then
    scan_forbidden "$output_dir" "built documentation"
    break
  fi
done

printf 'Terminology gate passed for %s\n' "$docs_dir"
