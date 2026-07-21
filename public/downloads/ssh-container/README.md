# CPU SSH workspace example

This example starts a non-root SSH service on port `2222` and authenticates
with one public key. It is intended for a CPU-only Run:ai workspace used for
file transfer. It does not contain a private key or password.

## Prepare the build context

1. Generate a key pair locally if you do not already have one:

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519
   ```

2. Copy only the public key into this directory as `id_ed25519.pub`.
3. Build and push the image with the Podman and Harbor workflow in the wiki.

Do not commit `id_ed25519`, and do not put a private key into the image.

## Run it

Create an interactive workspace with this image, select a CPU-only compute
resource, and mount the project PVC at `/data`. Once the workspace is running:

```bash
runai workspace port-forward WORKLOAD_NAME \
  --project PROJECT_NAME \
  --port 2222:2222
```

Keep that command running, then use a second terminal:

```bash
ssh -i ~/.ssh/id_ed25519 developer@localhost -p 2222
scp -P 2222 -i ~/.ssh/id_ed25519 -r ./local-data \
  developer@localhost:/data/
```

The `/data` path is persistent only when the workspace has a PVC mounted there.
