# Docker commands run during local dev setup

Chronological log of every Docker-related command run while building and verifying
the local dev container (build-plan item 1). Non-Docker commands (`curl`, `sed`,
`open -a Docker`) are noted only where they explain *why* the next Docker command
was needed.

## 1. First build attempt — failed

```bash
docker compose build
```

Failed: `dial unix /Users/theofernandez/.docker/run/docker.sock: connect: no such file or directory`.
Docker Desktop's daemon (`dockerd`) wasn't running — `docker compose` is a client;
it needs a live daemon to talk to over that socket.

## 2. Start Docker Desktop

```bash
open -a Docker
```

Not a Docker CLI command — macOS `open -a` launches the Docker Desktop app, which
starts the daemon in the background.

## 3. Poll until the daemon is ready

```bash
docker info
```

Run in a loop (10s sleep between tries) until it exits `0`. `docker info` prints
daemon/client status; a non-zero exit means the daemon isn't reachable yet. Used
here purely as a readiness check — the output itself wasn't needed.

## 4. Build the image

```bash
docker compose build
```

Reads `docker-compose.yml`, resolves the `app` service's `build: .` to the
`Dockerfile` in the project root, and builds it. No flags: default behavior uses
the layer cache, which is what proved the lockfile-first `COPY` ordering was
paying off — the reference build took ~57s (dependency install being the
bulk of it); a rebuild after only touching source files reuses that layer.

## 5. Start the container in the background

```bash
docker compose up -d
```

- `up` creates and starts every service in the compose file (here, just `app`).
- `-d` / `--detach` runs containers in the background and returns the shell
  immediately, instead of attaching to the container's stdout/stderr and
  blocking. Needed here because the same shell had to run `curl`/`docker exec`
  checks right after — a foreground `up` would have held the terminal.

## 6. Read the startup logs

```bash
docker compose logs app
```

Prints the `app` service's captured output (Next.js's own startup banner:
`▲ Next.js 16.3.3 (Turbopack)`, `✓ Ready in 242ms`). No flags used — this was a
one-shot read, not a follow (`-f` would have streamed and blocked).

## 7. Verify `node_modules` wasn't shadowed by the bind mount

```bash
docker compose exec app ls node_modules/next
docker compose exec app node -e "console.log(process.platform, process.arch)"
```

`exec` runs a one-off command *inside the already-running* `app` container
(as opposed to `run`, which would spin up a new container). `app` is the
service name from `docker-compose.yml`; everything after it is the command
executed inside that container. Confirmed `node_modules/next` exists and the
runtime is `linux arm64` — i.e. the Linux binaries built inside the image, not
the host's macOS ones the bind mount would otherwise have exposed.

## 8. Stop and remove the stack

```bash
docker compose down
```

Stops and removes the containers and the default network `compose` created for
this project. No `-v` was passed, so the `.env.local` values and image layers
stay untouched — this only tears down the running instance, not the build.

## 9. Restart to confirm no reinstall was needed

```bash
docker compose up -d
```

Same flag as step 5. Recreated the container from the already-built image —
confirmed by an immediate `HTTP 200` on `curl`, with no `pnpm install` output
in the logs (the image layer built in step 4 was reused as-is).

## 10. Final teardown

```bash
docker compose down
```

Same as step 8 — left the project with nothing running.

## 11. Later sanity check (separate turn)

```bash
docker compose ps
```

Lists containers belonging to this compose project and their state. Ran with
no flags to confirm the stack was fully down (empty output = nothing running)
before answering "is Docker still running in the background?".

## 12. Correction: `--build` alone doesn't refresh dependencies

Hit twice in this project (once when `frontend` added `@radix-ui/react-dialog`
etc., once when adding the test tooling in step 5): `docker compose up -d
--build` after a `package.json` change fails at container startup with
`[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY]`. Cause: the `node_modules`
volume (`docker-compose.yml`'s `- /app/node_modules`) is only seeded from the
image **once**, on first creation — rebuilding the image doesn't touch an
already-existing volume, so it still holds the old dependency set, and `next
dev`'s own startup check (via pnpm) detects the mismatch against the rebuilt
`package.json` and tries to auto-repair with an interactive prompt that has
no TTY to answer it non-interactively.

The actual ritual after adding a dependency:

```bash
docker compose down -v   # drops the stale node_modules volume too
docker compose up -d --build
```

`up -d --build` alone is only correct when `Dockerfile`/dependencies haven't
changed since the volume was created.

Also added `ENV CI=true` to the `Dockerfile` — pnpm's own suggested fix for
this exact error (it's in the error text) — so a `package.json` change that
doesn't actually need a full volume drop (e.g. only `scripts` changed) doesn't
hard-fail waiting on a TTY confirmation that will never come; it just
reinstalls non-interactively instead. This does NOT replace `down -v`: hit a
second, different failure the same session — `[EACCES] permission denied,
rmdir '/app/node_modules/.bin'` — when the volume's `node_modules` had
already gone through one failed partial reinstall. `CI=true` fixes the
"nobody's here to answer the prompt" case; `down -v` is still the fix once
the volume itself is in a bad state.
