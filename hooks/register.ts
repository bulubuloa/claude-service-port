import type { Register } from 'claude-code'

// A push or PR to a deploy branch ships to an environment; the user confirms first
const CONFIRM = /(^|\s)SERVICE_PORT_CONFIRMED=1\s/

// Token shapes worth masking in command output; extend as needed
const SECRET_PATTERNS: RegExp[] = [
  /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /(https?:\/\/)[^\s:@\/]+:[^\s@\/]+@/g,
]

const mask = (text: string): string =>
  SECRET_PATTERNS.reduce(
    (out, re) => out.replace(re, m => (m.startsWith('http') ? m.replace(/\/\/[^@]+@/, '//<cred>@') : '<masked>')),
    text,
  )

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const deployTarget = (command: string, branch: RegExp): string | undefined => {
  // gh pr create --base <branch> / -B <branch>
  const pr = /\bgh\s+pr\s+create\b[^\n;&|]*?(?:--base[ =]|-B\s+)([^\s;&|]+)/.exec(command)
  if (pr && branch.test(pr[1])) return pr[1]
  // git push <remote> <src>:<dst> or git push <remote> <branch>
  const push = /\bgit\s+push\b([^\n;&|]*)/.exec(command)
  if (push) {
    for (const arg of push[1].trim().split(/\s+/).filter(a => a && !a.startsWith('-'))) {
      const dst = arg.includes(':') ? arg.split(':').pop()! : arg
      const name = dst.replace(/^refs\/heads\//, '')
      if (branch.test(name)) return name
    }
  }
  return undefined
}

export const register: Register = (on, options) => {
  const branch = new RegExp(String(options?.deployBranchPattern ?? '^(publish-|deploy-|release/)'))
  const prefix = escapeRe(String(options?.configEnvPrefix ?? 'CFG_'))
  // CFG_X='{"a":1}' / -e CFG_X='"text"' : a shell strips the inner quotes and the app silently keeps its defaults
  const jsonThroughShell = new RegExp(`\\b${prefix}[A-Z0-9_]+=\\s*['"]?\\s*[\\[{"]`)

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = e.command

    const target = deployTarget(command, branch)
    if (target && !CONFIRM.test(command)) {
      return {
        deny:
          `${$.plugin.name}: "${target}" is a deploy branch, so this push/PR deploys. ` +
          `Ask the user to confirm this exact action; after a clear yes, re-run with SERVICE_PORT_CONFIRMED=1 in front of the command.`,
      }
    }

    if (jsonThroughShell.test(command)) {
      return {
        deny:
          `${$.plugin.name}: JSON config passed as ${options?.configEnvPrefix ?? 'CFG_'}* through a shell loses its quotes, ` +
          `and the app may silently fall back to real values from its committed config. Put the overrides in the compose file or an env file instead.`,
      }
    }

    if (/\b(dotnet\s+run|npm\s+(run\s+)?start|node\s+\S*(app|server|index)\.js)\b/.test(command)) {
      $.ui.toast(`${$.plugin.name}: running the service on the host can use real config; prefer the sealed contract stack.`)
    }

    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError || !ran.result) return ran

    const out = ran.result as { stdout?: string; stderr?: string }
    const stdout = typeof out.stdout === 'string' ? mask(out.stdout) : out.stdout
    const stderr = typeof out.stderr === 'string' ? mask(out.stderr) : out.stderr
    if (stdout === out.stdout && stderr === out.stderr) return ran
    return { result: { ...ran.result, stdout, stderr } as typeof ran.result }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: its guard failed.` }))
}
