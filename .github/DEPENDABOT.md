# Dependabot

How this repo keeps its dependencies current and secure, without paying for it or slowing down development.

Config: [`dependabot.yml`](./dependabot.yml)

---

## Why it matters here

`diagram-sync` ships to npm, so anyone who installs it also gets whatever it depends on. A stale or compromised dependency is our problem *and* our users' problem. Dependabot gives us three safeguards for free:

| Safeguard | Question it answers | Trigger |
|---|---|---|
| **Version updates** | Are we falling behind? | Schedule (weekly) |
| **Security alerts** | Do we already depend on something known to be vulnerable? | New advisory published |
| **Security updates** | Can the fix be applied for us? | Alert with a patched version available |

**Cost: $0.** Dependabot is free on every GitHub repository, public or private. Its own jobs don't count against Actions minutes. The only cost is the CI run each Dependabot PR triggers, which is free on public repos and small on private ones because of the grouping below.

---

## Core concepts

**Dependency graph**
GitHub reads `package.json`, `package-lock.json` and `.github/workflows/*.yml` to build a map of everything we depend on, including transitive packages. Alerts and security updates both rely on it.

**GitHub Advisory Database**
The source of vulnerability data: a curated set of CVEs and GitHub-reviewed advisories. When a new advisory matches something in our dependency graph, an alert opens under **Security → Dependabot**.

**Version updates vs. security updates**
- *Version updates* follow the schedule in `dependabot.yml` and keep us current.
- *Security updates* don't depend on the schedule. They open as soon as a patched version exists, and they **skip the cooldown** described below.

**Ecosystems**
Each `package-ecosystem` entry is watched separately. We watch two of them:
- `npm`: runtime and dev dependencies.
- `github-actions`: the actions our workflows use (`actions/checkout`, `actions/setup-node`, …). They run with repo access, so they are part of the supply chain too.

---

## How our config keeps friction low

| Setting | What it does | Why |
|---|---|---|
| `interval: weekly`, `day: thursday` | One batch per week, mid-week | Predictable. Leaves time to merge before the weekend, and avoids reviewing on Monday morning. |
| `groups` (dev / runtime / actions) | Minor and patch bumps arrive as **one PR per group** | About 3 PRs a week instead of 15. Fewer CI runs, less review fatigue. |
| Majors excluded from groups | Each major bump gets its **own PR** | Breaking changes are reviewed one at a time, never hidden in a bundle. |
| `cooldown` (7 days, 14 for majors) | Ignores releases younger than the cooldown | Most malicious or broken npm releases are pulled within days. Waiting a week costs little and avoids most of that risk. Security fixes are exempt. |
| `open-pull-requests-limit: 5` | Caps how many npm PRs can be open at once | The queue can't grow beyond what we can handle. |
| `commit-message.prefix` | `chore(deps)`, `chore(dev-deps)`, `chore(actions)` | Easy to filter in history and changelogs, and clearly separate from feature work. |

> **Rule of thumb:** a routine week means 1 to 3 green PRs that each take a minute to review. If it's more than that, adjust the config. Don't just ignore the PRs.

---

## Security features to enable (all free)

Turn these on in **Settings → Code security**. They are separate from `dependabot.yml`, which only controls version updates.

| Feature | What you get | Free on |
|---|---|---|
| Dependency graph | Inventory of all direct and transitive dependencies | All repos |
| Dependabot alerts | Notified when a dependency has a known vulnerability | All repos |
| Dependabot security updates | Automatic fix PRs for those alerts | All repos |
| Grouped security updates | Several fixes combined into one PR | All repos |
| Dependabot auto-triage rules | Dismiss alerts that don't apply to us (e.g. low-impact dev-only issues) | All repos |
| Secret scanning + push protection | Blocks commits that contain tokens or keys | Public repos (private repos need GitHub Advanced Security) |
| Dependency review action | Fails a PR that *adds* a vulnerable dependency | Public repos (private repos need GitHub Advanced Security) |

**Scope note:** what matters is what we ship. `npm audit --omit=dev` covers the published package, while the full `npm audit` also covers our tooling. Fix both, but a runtime vulnerability is an incident and a dev-only one is maintenance.

---

## Handling a Dependabot PR

1. **CI green?** Build, test and lint on Node 20 / 22 / 24 are the gate. Don't merge on red.
2. **Patch or minor in a group?** Skim the changelog links in the PR body, then merge.
3. **Major?** Read the release notes for breaking changes, check our usage, fix if needed, then merge. If it isn't the right time, use `@dependabot ignore this major version`. Don't let the PR rot.
4. **Security update?** Takes priority. Merge, and cut a patch release if it touches a runtime dependency.

Useful PR comment commands:

| Command | Effect |
|---|---|
| `@dependabot rebase` | Rebase onto the latest `main` |
| `@dependabot recreate` | Rebuild the PR from scratch (discards manual edits) |
| `@dependabot ignore this major version` | Skip this major version until a newer one is released |
| `@dependabot ignore this dependency` | Stop updating this package (use sparingly and record the reason) |

**Secrets:** workflows triggered by Dependabot get a read-only `GITHUB_TOKEN` and **can't see Actions secrets**. Any secret a CI step needs on these PRs has to be added under *Settings → Secrets → Dependabot*. Steps that are allowed to fail (like the Coveralls upload) are unaffected.

---

## Optional: zero-touch merging

When the PR volume stays steady and CI is reliable, safe updates can merge themselves:

- **Scope:** grouped *patch* bumps of *dev dependencies* and GitHub Actions only. Runtime dependencies and majors always get a human review.
- **How:** a small workflow uses [`dependabot/fetch-metadata`](https://github.com/dependabot/fetch-metadata) to read the update type, then runs `gh pr merge --auto --squash`.
- **Prerequisite:** branch protection on `main` with CI as a required check. Auto-merge then waits for green, so nothing merges unchecked.

This cuts routine dependency work to almost nothing while keeping humans on the changes that matter.

---

## Production microservices: what to watch for

This repo is a small CLI, but the same setup is often copied to services that run in production. There, a bad dependency bump means an outage, not a failed build. Keep these in mind.

### 1. A green PR is only as good as your tests
Dependabot changes version numbers. Your tests decide whether that's safe.
- Unit tests rarely catch behaviour changes in **database drivers, ORMs, HTTP clients, serializers or auth libraries**. Those need integration or contract tests running in CI.
- If a dependency has no test exercising it, treat every bump to it as a manual review.

### 2. Merging is not deploying
- Ship dependency updates through the **same pipeline as code**: staging, then canary, then full rollout, with a rollback plan.
- Merge **one group at a time** and let it deploy before merging the next. If something breaks, you know which bump caused it.
- Avoid merging dependency PRs right before a freeze, a weekend, or a big release.

### 3. Read the lockfile diff, not just the title
- A PR titled "bump X 1.2.3 → 1.2.4" can update dozens of **transitive** packages in `package-lock.json`. Skim what else moved.
- Watch for new packages with **install scripts** (`postinstall`) and for a package suddenly published by a different maintainer. Both are common supply-chain attack patterns.

### 4. Majors are projects, not PRs
Framework and runtime majors (Express, Spring, Node, a database client) usually need code changes, config changes and a rollout plan. Track them as a ticket, close the PR with `@dependabot ignore this major version`, and schedule the work.

### 5. Watch every layer you ship
A service is more than its `package.json`. Add an `updates` entry for each layer:
- `docker`: base images (`node:20-alpine`). This is often where most CVEs come from. Pin by digest and let Dependabot bump it.
- `github-actions`: your CI/CD steps.
- `terraform`, `helm` and similar: infrastructure, if it lives in the same repo.

### 6. Many services means many PRs
- Use `directories` (plural) and `groups` so one update across 10 services is **one PR**, not ten.
- **Stagger schedules** across repos (different days) so one team isn't reviewing every service on the same morning.
- Keep shared libraries on the **same version across services**. Version drift causes subtle bugs between services.

### 7. Private registries and secrets
- Internal packages need a `registries` block in `dependabot.yml`. The credentials go under **Settings → Secrets → Dependabot**, not Actions secrets.
- Never use `pull_request_target` to give Dependabot PRs more permissions while checking out the PR's code. It lets dependency code run with write access and your secrets.

### 8. Guardrails on automation
- Auto-merge **only** dev dependencies and patch updates, and only behind required CI checks on a protected branch.
- **Runtime dependencies and security fixes in production code always get a human review**, even when CI is green.
- Route PRs to the owning team with `CODEOWNERS`, so every service has someone responsible for its updates.

### 9. Keep the noise down so real alerts get attention
- Use auto-triage rules to dismiss alerts that don't apply (dev-only, or the vulnerable code path isn't used), and **write down why**.
- Review `ignore` rules every quarter. An ignored package silently falls behind until it becomes an emergency upgrade.
- Set an internal fix-time target, for example *critical within 48h, high within 7 days*, so alerts get acted on.

### 10. Licences change too
A new version can switch licence (for example MIT to a source-available licence). For commercial services, add the dependency review action with an allowed-licence list, or check licences in your release process.

---

## Changing the config

- Edit [`dependabot.yml`](./dependabot.yml). Changes take effect on the next scheduled run, or immediately via **Insights → Dependency graph → Dependabot → Check for updates**.
- Adding a new ecosystem (for example a `Dockerfile`)? Add another `updates` entry with the same schedule, cooldown and grouping pattern.
- Reference: [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference)
