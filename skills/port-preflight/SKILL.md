---
name: port-preflight
description: Use before starting (or resuming) a 1:1 service port, and before any deploy of the ported service. Finds code that exists only on live environment branches, reads the live deploy pipelines, and checks the local test machine, so gaps are found on day one instead of at release.
---

# Port preflight

Run this before writing any ported code, again before each environment's first deploy, and whenever the port has been paused for more than a few days. Report findings as a table; do not change anything.

## 1. Code that is only on live branches

The port mirrors one base commit. Environments often run code that never reached that base (hotfixes merged straight into a release branch, environment-only features).

1. `git fetch --all --prune`
2. Note the port base commit (the source commit the port mirrors).
3. For every environment branch (dev / staging / production deploy branches, and the main integration branch):
   - `git diff --stat <base> origin/<branch> -- <source dir>` — compare **trees**, not `git log`: environment branches often carry cherry-picked copies of the same change, so commit lists overstate the gap.
   - For each changed file, classify: already in the port, needs porting, or environment-only (decide whether the ported build must carry it).
4. Look for in-flight feature branches that will land before cutover (`git for-each-ref --sort=-committerdate refs/remotes`).

## 2. Live deploy pipelines

Never trust the copy of a workflow on the port branch; read the one on the branch that deploys.

- `git show origin/<deploy-branch>:<workflow path>` for each environment.
- Record per environment: runner type (hosted vs self-hosted, and whether it still works), secret store and secret names, how config reaches the app (baked into the image, mounted file, env vars), target (container host, k8s namespace), probes and the routes they call, release tagging, concurrency group.
- Health/readiness routes the platform calls must exist in the ported build.
- Note automated PRs (dependency bots) that target deploy branches: each update redeploys the **old** build.

## 3. Local test machine

- Native vs emulated images (`docker info`, image platform vs host arch). Emulation makes runs slower and timing tests flaky: prefer native builds or a CI runner of the target arch.
- Free disk in the Docker VM (a full disk makes Redis refuse writes and fails random cases).
- Git-ignored test material that CI will not have (generated certs, keys, seed outputs): list how CI will create it.

## 4. Output

A table per section with: item, where, impact, action. Then a short list of what must happen before the next step (port / deploy).

See also `TRAPS.md` in this plugin.
