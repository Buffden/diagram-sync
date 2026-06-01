# diagram-sync

> Keep architecture diagrams synchronized with source code.

`diagram-sync` is a CLI tool that automatically generates SVG files from PlantUML diagram source files. Drop it into any repo and run `npx diagram-sync` — it finds every `.puml` file, renders it to SVG, and mirrors the output under a `diagrams/` folder. No config required.

```bash
npx diagram-sync
```

---

## The Problem

Engineering teams update code but forget to re-export architecture diagrams. The result is stale documentation — READMEs, wikis, and onboarding docs that no longer reflect reality.

`diagram-sync` eliminates the manual export step entirely. You edit the `.puml` source. It generates the SVG automatically — locally or in CI/CD.

> **Honest note:** This tool removes export friction. It does not force developers to keep source diagrams accurate. That is a people problem, not a tooling problem.

---

## Install

```bash
# one-off, no install required
npx diagram-sync

# or install globally
npm install -g diagram-sync

# or as a dev dependency
npm install --save-dev diagram-sync
```

---

## Quick Start

1. Add a `.puml` file anywhere in your repo
2. Run `npx diagram-sync` from the project root
3. Find the generated SVG in `diagrams/` mirroring the source path

```text
src/services/payment/flow.puml       →  diagrams/src/services/payment/flow.svg
docs/architecture/system.puml        →  diagrams/docs/architecture/system.svg
```

Reference in your README:

```markdown
![System Architecture](diagrams/docs/architecture/system.svg)
```

---

## How It Works

- Recursively scans your repo for diagram source files
- Skips `node_modules`, `.git`, `dist`, `build`, `diagrams`
- Derives the output path from the source file location — no input/output directories to configure
- Generates SVGs using the installed diagram tool (PlantUML for `.puml` files)

---

## Configuration

Config is optional. By default `diagram-sync` discovers all supported source files and generates SVGs.

Optionally add `diagram-sync.config.json` to your project root:

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

```bash
npx diagram-sync --config diagram-sync.config.json
```

### Job Options

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Label for the job (used in logs) |
| `type` | `string` | Diagram provider (`plantuml`) |

---

## Supported Providers

| Provider | Status |
|---|---|
| PlantUML | Supported |
| Mermaid | Planned |
| Graphviz | Planned |
| Draw.io | Planned |

---

## Usage Options

### 1. One-off local generation

```bash
npx diagram-sync
```

### 2. npm script

```json
"scripts": {
  "diagrams": "diagram-sync"
}
```

```bash
npm run diagrams
```

### 3. CI/CD — generate only

Generates SVGs on every push. Files exist only in the runner and are not committed.

Create `.github/workflows/diagram-sync.yml`:

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

> Triggers automatically when any `.puml` file is pushed. Also runnable manually from **GitHub → Actions → Generate Diagrams → Run workflow**.

### 4. CI/CD — generate and commit to main

Generates SVGs and pushes them directly to `main`. Uses a PAT with admin privileges to bypass branch protection.

**Flow:**
1. Push a `.puml` change to any branch
2. Workflow generates SVGs
3. SVGs are committed and pushed directly to `main`

Requires a **Personal Access Token (PAT)** with `contents: write` permission saved as a repository secret named `PAT_TOKEN`. [How to create a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

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
          git fetch origin main
          git reset --soft origin/main
          git add diagrams/
          if git diff --staged --quiet; then
            echo "No diagram changes to commit."
          else
            git commit -m "chore: auto-export diagrams [skip ci]"
            git push origin HEAD:main
          fi
```

> **Prefer a PR review step?** Push to a separate branch and use `gh pr create` targeting `main`. Add `pull-requests: write` to your PAT permissions.

---

## Requirements

- Node.js 18+
- Java 11+ (`brew install openjdk` or `apt install default-jre`)
- PlantUML (`brew install plantuml` or `apt install plantuml`)

---

## Common Use Cases

- **How to automate PlantUML SVG generation in CI/CD**
- **How to keep README architecture diagrams up to date automatically**
- **How to sync PlantUML diagrams from source files**
- **How to generate architecture diagrams on GitHub Actions**
- **How to treat architecture diagrams as code**
- **Documentation-as-code workflow for PlantUML**

---

## License

MIT — [Buffden](https://buffden.com)
