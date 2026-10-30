---
name: port-deploy
description: Use when deploying the ported build to an environment for the first time, or changing how it deploys. Creates a new pipeline from the live one instead of editing it, retires the old pipeline, and verifies the rollout.
---

# Deploy the ported build

## Pipeline

1. Read the **live** workflow from the branch that deploys (`git show origin/<deploy-branch>:<path>`), not the copy on the port branch.
2. Create a **new** workflow file (e.g. `publish-<env>-<runtime>.yaml`) from it. Change only the build job: build and test the new runtime, push the image with the same tag scheme. Keep secret fetching, runners, deploy job, concurrency group and release tagging as they are.
3. Retire the old workflow by commenting out its trigger (keep a manual trigger for reference) with a one-line note naming the replacement. Do not delete it until the old runtime is gone everywhere.
4. Before tests in CI, generate any git-ignored test material (throwaway certs, keys) the tests need.
5. Keep secrets out of the image: config comes from the secret store at deploy time (mounted file or env), never baked in.
6. Make the app report its image tag as version (build arg → env var → version override), so every environment shows what runs.

## Before the first deploy

- Health/readiness routes the platform probes exist in the new build and behave like the original's.
- A dry run where possible (deploy scaled to 0, check secret, image pull, probes).
- Dependency-bot PRs that target the deploy branch: they run the old pipeline until the new one is merged; close or pause them.
- Write down the last image tag of the old runtime for rollback.

## Deploy

- Opening or updating a PR to a deploy branch usually deploys. Do it only with explicit confirmation.
- If the PR conflicts, GitHub does not run `pull_request` workflows: use a dedicated deploy branch whose tree equals the port branch, with the deploy branch as a parent (`git commit-tree <port>^{tree} -p origin/<deploy> -p <port>`), so it merges cleanly without changing the port branch.

## After

- Check the run's jobs, the rollout status, `/` (version) and the readiness route from outside.
- Record image tag, run id and rollback command in the ticket.
