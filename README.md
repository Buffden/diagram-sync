# diagram-sync

> Keep architecture diagrams synchronized with source code.

`diagram-sync` is a CLI tool that automatically generates SVG files from diagram source files. It removes the manual export step so your README, wiki, and documentation always reflect the latest diagram sources.

---

## The Problem

Teams maintain architecture diagrams as image files in their repos. When the system changes, the source diagram gets updated — but the exported image doesn't. The result is stale documentation that nobody trusts.

`diagram-sync` automates the export step. You edit the source. It handles the rest.

> **Note:** This tool targets teams that already maintain diagram source files. It removes export friction — it does not force anyone to keep sources up to date. That's a culture problem, not a tooling problem.

---

## Installation

```bash
npx diagram-sync
```

Or install globally:

```bash
npm install -g diagram-sync
```

---

## Quick Start

1. Run from your project root:

```bash
npx diagram-sync
```

That's it. `diagram-sync` recursively finds all diagram source files in your repo and generates SVGs into a `diagrams/` directory, mirroring each file's original path.

2. Optionally add a config file for named jobs:

```json
{
  "jobs": [
    {
      "name": "architecture",
      "type": "plantuml"
    }
  ]
}
```

---

## How Output Paths Work

No input or output directories to configure. The output location is derived automatically from where the source file lives:

```text
src/services/payment/flow.puml
→ diagrams/src/services/payment/flow.svg

docs/architecture/system.puml
→ diagrams/docs/architecture/system.svg
```

The `diagrams/` folder at your repo root is always the output root. The internal structure mirrors your source tree exactly.

---

## Configuration

Config is optional. Without it, `diagram-sync` runs with defaults — discovers all supported diagram source files and generates SVGs into `diagrams/`.

### Job Options

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Label for the job (used in logs) |
| `type` | `string` | Diagram provider (`plantuml`) |

### Custom Config Path

```bash
npx diagram-sync --config path/to/diagram-sync.config.json
```

---

## Supported Providers

| Provider | Status |
|---|---|
| PlantUML | V1 |
| Mermaid | Planned |
| Graphviz | Planned |
| Draw.io | Planned |

---

## Example

Source file anywhere in your repo:

```text
src/services/payment/flow.puml
```

Generated output, mirroring the path:

```text
diagrams/src/services/payment/flow.svg
```

Reference it in your README:

```markdown
![Payment Flow](diagrams/src/services/payment/flow.svg)
```

---

## Usage Options

### 1. One-off local generation

Run from your project root whenever you want to regenerate diagrams:

```bash
npx diagram-sync
```

### 2. npm script

Install as a dev dependency and add a script to your `package.json`:

```bash
npm install --save-dev diagram-sync
```

```json
"scripts": {
  "diagrams": "diagram-sync"
}
```

```bash
npm run diagrams
```

### 3. CI/CD — generate only

Regenerates SVGs on every push. Generated files exist only in the runner and are not saved back to the repo.

Create `.github/workflows/diagram-sync.yml` in your repo:

```yaml
name: Generate Diagrams

on:
  push:
    paths:
      - '**/*.puml'
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install PlantUML
        run: |
          sudo apt-get update
          sudo apt-get install -y --no-install-recommends default-jre plantuml

      - name: Generate diagrams
        run: npx diagram-sync
```

> The workflow triggers automatically when any `.puml` file is pushed. You can also trigger it manually from **GitHub → Actions → Generate Diagrams → Run workflow**.

### 4. CI/CD — generate and commit (direct push)

Generates SVGs and pushes them directly to `main`. Uses a PAT so the bot carries your admin privileges and bypasses branch protection.

**Flow:**
1. You push a `.puml` file change to any branch
2. Workflow triggers, generates SVGs
3. SVGs are committed and pushed directly to `main`

Requires a **Personal Access Token (PAT)** with `contents: write` permissions added as a repository secret named `PAT_TOKEN`. See [how to create a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

```yaml
name: Generate Diagrams

on:
  push:
    paths:
      - '**/*.puml'
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_TOKEN }}

      - name: Install PlantUML
        run: |
          sudo apt-get update
          sudo apt-get install -y --no-install-recommends default-jre plantuml

      - name: Generate diagrams
        run: npx diagram-sync

      - name: Commit generated SVGs
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add diagrams/
          if git diff --staged --quiet; then
            echo "No diagram changes to commit."
          else
            git commit -m "chore: auto-export diagrams [skip ci]"
            git push origin main
          fi
```

> **Prefer a PR review step?** Push to a separate branch and use `gh pr create` to open a PR targeting `main` instead of pushing directly. Add `pull-requests: write` to your PAT permissions.

Future versions will support a staleness check — failing the build when source files have changed but outputs have not been regenerated.

---

## Requirements

- Node.js 18+
- Java 11+ (`brew install openjdk` or `apt install default-jre`)
- plantuml (`brew install plantuml` or `apt install plantuml`)

---

## License

MIT
