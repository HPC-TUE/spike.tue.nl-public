#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s CONTAINER_NAME HARBOR_PROJECT VERSION CONTAINERFILE\n' "$0" >&2
  printf 'Example: %s training-demo research 1.0.0 Containerfile\n' "$0" >&2
}

if [ "$#" -ne 4 ]; then
  usage
  exit 64
fi

container_name="$1"
harbor_project="$2"
version="$3"
containerfile="$4"
registry='harbor.spike.tue.nl'

validate_segment() {
  case "$1" in
    ''|*[!a-z0-9._-]*)
      printf 'Invalid %s: use lowercase letters, numbers, dots, underscores, and hyphens only.\n' "$2" >&2
      exit 65
      ;;
  esac
}

validate_segment "$container_name" 'container name'
validate_segment "$harbor_project" 'Harbor project'
validate_segment "$version" 'version'

if ! command -v podman >/dev/null 2>&1; then
  printf 'Podman is not installed or is not on PATH. Install Podman, then retry.\n' >&2
  exit 69
fi

if [ ! -f "$containerfile" ]; then
  printf 'Containerfile not found: %s\n' "$containerfile" >&2
  exit 66
fi

if ! podman login --get-login "$registry" >/dev/null 2>&1; then
  printf 'No active Harbor login for %s. Run: podman login %s\n' "$registry" "$registry" >&2
  exit 77
fi

image="$registry/$harbor_project/$container_name:$version"
printf 'Building %s for linux/amd64…\n' "$image"

if ! podman build --platform linux/amd64 --tag "$image" --file "$containerfile" .; then
  printf 'Build failed. Inspect the Containerfile and build output, then retry.\n' >&2
  exit 1
fi

printf 'Pushing %s…\n' "$image"
if ! podman push "$image"; then
  printf 'Push failed. Confirm Harbor project membership and refresh the login with podman login %s.\n' "$registry" >&2
  exit 1
fi

printf 'Published %s\n' "$image"
