# Traps

Problems met while porting a production service 1:1 to another runtime and deploying it. Each has the symptom you see and what fixes or avoids it.

## Testing

| Trap | Symptom | Fix |
| --- | --- | --- |
| Emulated images (amd64 on arm64) | Runs take far longer; timing cases fail at random | Build native images for local runs, or run the suite on a CI runner of the target arch |
| One shared test stack | Workers wait on a lock for hours | One stack per worker (`scripts/worker-stack.sh`) |
| Full suite for every change | Tens of minutes per iteration | Run affected cases while working (`scripts/affected-cases.sh`), the full suite once before commit |
| Fixed sleeps in cases | Flakes that block releases | Wait for a condition; triage with `scripts/flake-triage.sh` |
| Cases sharing auto-increment ids | IDs off by one when run in another order | Keep recorded order, or give each case its own id range |
| Seed dates fixed in time | A case starts failing months later | Seed dates relative to now where behaviour depends on age |
| Docker VM disk full | Cache server refuses writes; random failures | Check free disk before long runs; prune old build cache |
| Git-ignored test material (certs, keys) | Tests pass locally, fail in CI | Generate it in CI before tests |

## Port correctness

| Trap | Symptom | Fix |
| --- | --- | --- |
| "Equivalent" library differs | Wrong sizes/encodings found late (e.g. a QR library choosing another code size) | Verify each building block against recorded outputs first (`port-component-first`) |
| Event-loop semantics on a thread pool | Final state written after cleanup; sessions stuck "started" | Keep one ordered queue per request, also after "complete"; match the original's phase order; test it explicitly |
| Resource close not finalizing children | A file closed with pending statements is not flushed; size differs at random | Finalize/dispose children before close, as the original library does |
| Periodic timer vs re-armed timeout | Job cadence drifts from the original | Re-arm after each run if the original does |
| Time zone assumptions | Passes only when the process runs in UTC | Use the process zone like the original; test under a non-UTC zone |
| Route matching order | Wildcard route wins over a literal one | Match the original router's priority (literal paths first) |
| Template syntax in config | Startup fails on config features the simple renderer lacks | Render config with the same template engine as the original |

## Environments and deploy

| Trap | Symptom | Fix |
| --- | --- | --- |
| Port branch holds an old copy of a pipeline | Deploy runs on a retired runner / old secret names / old hosting | Read the live workflow from the deploy branch; create a new pipeline from it |
| Editing the live pipeline in place | Old and new mixed; hard to roll back | New pipeline file; retire the old one by commenting out its trigger |
| Environment-only code | Health/probe routes or hotfixes missing from the port | Diff trees of every environment branch against the port base before starting and before each deploy |
| Platform probes call routes the port lacks | Rollout never becomes ready | Port the probe routes first |
| Dependency-bot PRs on deploy branches | Old runtime redeployed over the new one | Close/pause them; merge the new pipeline so they run it |
| PR to deploy branch conflicts | Workflow never starts | Deploy branch whose tree equals the port branch, with the deploy branch as a parent |
| Config baked into image vs mounted | Version shows a placeholder; secrets in image | Mount config at deploy; set version from the image tag |
| Two runtimes side by side | Background jobs and queue consumers run twice | Replace, never run both; one replica until jobs are leader-elected |

## Process

| Trap | Symptom | Fix |
| --- | --- | --- |
| Credential inside a git remote URL | Token printed in logs | Redact remote output; move to a credential helper; rotate |
| JSON config through a shell | Quotes stripped; app silently uses committed real values | Put overrides in compose/env files (the plugin's hook blocks the shell form) |
| "Log work" ambiguity | Time logged in the wrong tool | Confirm the team's time-tracking tool before logging |
