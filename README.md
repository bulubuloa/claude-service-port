# service-port

A Claude Code plugin for porting a service 1:1 to another runtime (for example Node.js to .NET) behind a recorded contract suite, and for deploying the ported build safely. It packages what we learned the hard way: check every live branch and pipeline first, prove building blocks before routes, run tests fast and in parallel, and never deploy by accident.

## Install

In a Claude Code terminal session:

```
/plugin install service-port --marketplace bulubuloa/claude-service-port
```

Answer `y` to add the marketplace, then pick a scope.

## What it adds

**Skills** (Claude uses them when the task fits, or ask for them by name):

| Skill | Use it |
| --- | --- |
| `port-preflight` | Before porting or deploying: code that exists only on environment branches, live pipelines, local machine checks |
| `port-component-first` | Prove encoders, template engines, compression, event-loop order etc. against recorded outputs before routes |
| `port-file` | Port one file 1:1, gated by its contract cases |
| `record-contract` | Write and record cases from the original service, including side effects |
| `review-port` | Review a port change side by side with the original |
| `port-deploy` | New pipeline from the live one, retire the old, deploy and verify |

**Guard hooks** (on every Bash call):

- A `git push` or `gh pr create` to a deploy branch is refused until the user confirms; after a clear yes, Claude re-runs it with `SERVICE_PORT_CONFIRMED=1` in front.
- JSON config passed through a shell as `CFG_*=...` is refused (the shell strips quotes and the app may fall back to real values).
- Running the service directly on the host shows a warning toast.
- Tokens, private keys and credentials in URLs are masked in command output.

Settings (`/plugin` → service-port → configure):

- `deployBranchPattern` — default `^(publish-|deploy-|release/)`
- `configEnvPrefix` — default `CFG_`

**Scripts** (`scripts/`, run from your repo):

- `affected-cases.sh [base]` — contract case files affected by the current change (optional `case-map.txt` of `<path-glob> <case-glob>` lines)
- `worker-stack.sh up|down|ports <n>` — private copy of the compose stack per worker, ports offset by worker number
- `flake-triage.sh <failed-ids> [runs]` — re-runs failures alone and splits real failures from timing flakes

**[TRAPS.md](TRAPS.md)** — the problems we hit, their symptoms and fixes.

## Assumptions

The skills assume a contract suite: requests recorded against the original service on a sealed docker-compose stack (mocks for every third party) and replayed against the new one. The scripts read their paths and commands from environment variables; see the header of each script.

## License

MIT
