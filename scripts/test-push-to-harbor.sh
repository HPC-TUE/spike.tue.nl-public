#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
script="$script_dir/../public/downloads/push-to-harbor.sh"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

containerfile="$work_dir/Containerfile"
printf 'FROM scratch\n' > "$containerfile"

expect_status() {
  local expected="$1"
  shift
  set +e
  "$@" >/dev/null 2>&1
  local actual="$?"
  set -e
  if [ "$actual" -ne "$expected" ]; then
    printf 'Expected status %s, received %s: %s\n' "$expected" "$actual" "$*" >&2
    exit 1
  fi
}

make_mock() {
  local behavior="$1"
  mkdir -p "$work_dir/bin"
  cat > "$work_dir/bin/podman" <<MOCK
#!/usr/bin/env bash
case "\$1" in
  login) [ "$behavior" = "login-fail" ] && exit 1; exit 0 ;;
  build) [ "$behavior" = "build-fail" ] && exit 1; exit 0 ;;
  push) [ "$behavior" = "push-fail" ] && exit 1; exit 0 ;;
  *) exit 0 ;;
esac
MOCK
  chmod +x "$work_dir/bin/podman"
}

expect_status 64 bash "$script"
expect_status 65 bash "$script" 'bad/name' project 1.0.0 "$containerfile"
expect_status 69 env PATH="/usr/bin:/bin" bash "$script" image project 1.0.0 "$containerfile"

make_mock login-fail
expect_status 77 env PATH="$work_dir/bin:/usr/bin:/bin" bash "$script" image project 1.0.0 "$containerfile"
make_mock build-fail
expect_status 1 env PATH="$work_dir/bin:/usr/bin:/bin" bash "$script" image project 1.0.0 "$containerfile"
make_mock push-fail
expect_status 1 env PATH="$work_dir/bin:/usr/bin:/bin" bash "$script" image project 1.0.0 "$containerfile"
make_mock success
expect_status 0 env PATH="$work_dir/bin:/usr/bin:/bin" bash "$script" image project 1.0.0 "$containerfile"

printf 'Podman push script tests passed.\n'

