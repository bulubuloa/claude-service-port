import { expect, test } from 'claude-code/testing'

// The test's own tool.call hook stands for the engine: it answers what a real Bash run would print.
const engine = (stdout: string) => () => ({ result: { stdout, stderr: '', interrupted: false } })

test('a push to a deploy branch is refused until confirmed', async ($, on) => {
  on('tool.call', engine('pushed'))

  const refused = await $.tool.call({ tool: 'Bash', command: 'git push origin HEAD:publish-stag' })
  expect(refused.deny).toBeDefined()

  const pr = await $.tool.call({ tool: 'Bash', command: 'gh pr create --base publish-prod --title x --body y' })
  expect(pr.deny).toBeDefined()

  const confirmed = await $.tool.call({ tool: 'Bash', command: 'SERVICE_PORT_CONFIRMED=1 git push origin HEAD:publish-stag' })
  expect(confirmed.deny).toBeUndefined()

  const feature = await $.tool.call({ tool: 'Bash', command: 'git push origin feature/x' })
  expect(feature.deny).toBeUndefined()
})

test('JSON config through a shell is refused', async ($, on) => {
  on('tool.call', engine('ok'))

  const refused = await $.tool.call({ tool: 'Bash', command: `CFG_REDIS='{"host":"x"}' docker compose up -d` })
  expect(refused.deny).toBeDefined()

  const plain = await $.tool.call({ tool: 'Bash', command: 'CFG_WORKERS=1 echo ok' })
  expect(plain.deny).toBeUndefined()
})

test('tokens and URL credentials are masked in output', async ($, on) => {
  on('tool.call', engine('origin https://user:abc123@github.com/o/r.git token ghp_' + 'a'.repeat(36)))

  const ran = await $.tool.call({ tool: 'Bash', command: 'git remote -v' })
  const text = JSON.stringify(ran)
  expect(text).not.toContain('abc123')
  expect(text).not.toContain('ghp_aaaa')
  expect(text).toContain('<cred>@github.com')
})
