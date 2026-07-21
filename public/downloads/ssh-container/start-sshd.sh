#!/bin/sh
set -eu

SSH_DIR=/home/developer/.ssh
HOST_KEY="$SSH_DIR/ssh_host_ed25519_key"

if [ ! -f "$HOST_KEY" ]; then
  ssh-keygen -t ed25519 -f "$HOST_KEY" -N '' -q
fi

exec /usr/sbin/sshd -D -e -f "$SSH_DIR/sshd_config" \
  -o PidFile="$SSH_DIR/sshd.pid" \
  -o UsePAM=no
