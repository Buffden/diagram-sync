# diagram-sync

> Keep architecture diagrams synchronized with source code.

[![npm version](https://img.shields.io/npm/v/diagram-sync)](https://www.npmjs.com/package/diagram-sync)
[![npm downloads](https://img.shields.io/npm/dt/diagram-sync)](https://www.npmjs.com/package/diagram-sync)
[![license](https://img.shields.io/npm/l/diagram-sync)](./LICENSE)
[![coverage](https://coveralls.io/repos/github/Buffden/diagram-sync/badge.svg?branch=main)](https://coveralls.io/github/Buffden/diagram-sync?branch=main)

`diagram-sync` is a CLI tool that automatically generates images from diagram source files. Drop it into any repo and run `npx diagram-sync` — it finds every supported diagram file, renders it to an image, and mirrors the output under a `diagrams/` folder. No config required.

```bash
npx diagram-sync
```

![demo](https://raw.githubusercontent.com/Buffden/diagram-sync/main/demo.gif)

---

## The Problem

Engineering teams update code but forget to re-export architecture diagrams. The result is stale documentation — READMEs, wikis, and onboarding docs that no longer reflect reality.

`diagram-sync` eliminates the manual export step entirely. You edit the diagram source file. It generates the image automatically — locally or in CI/CD.

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

1. Add a supported diagram source file anywhere in your repo
2. Run `npx diagram-sync` from the project root
3. Find the generated image in `diagrams/` mirroring the source path

```text
src/services/payment/flow.puml       →  diagrams/src/services/payment/flow.svg
docs/architecture/system.puml        →  diagrams/docs/architecture/system.svg
docs/flows/auth.mmd                  →  diagrams/docs/flows/auth.svg
src/infra/pipeline.dot               →  diagrams/src/infra/pipeline.svg
src/infra/network.d2                 →  diagrams/src/infra/network.svg
docs/architecture/sketch.excalidraw  →  diagrams/docs/architecture/sketch.svg
docs/processes/checkout.bpmn         →  diagrams/docs/processes/checkout.svg
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
- Generates images using the installed diagram tool for each provider — defaults to SVG, configurable via `--format` flag or config file

---

## Configuration

Config is optional. By default `diagram-sync` discovers all supported source files and generates images.

Optionally add `diagram-sync.config.json` to your project root:

```json
{
  "format": "svg",
  "jobs": [
    {
      "name": "architecture",
      "type": "plantuml",
      "format": "pdf"
    }
  ]
}
```

Load the config file:

```bash
npx diagram-sync --config diagram-sync.config.json
```

Override format at runtime:

```bash
npx diagram-sync --format svg
```

Format resolution order: `--format` flag → job `format` → global `format` → default `svg`.

### Job Options

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Label for the job (used in logs) |
| `type` | `string` | Diagram provider (`plantuml`, `mermaid`, `graphviz`, `drawio`, `d2`, `excalidraw`, `bpmn`) |
| `format` | `string` | Output format for this job (e.g. `png`, `svg`, `pdf`) — overrides global format |

---

## Supported Providers

`diagram-sync` supports any diagram source that is committed to Git, maintained as a file, and can be converted to an image via a CLI — regardless of whether it was created by hand, a GUI tool, or AI.

| Provider | Extensions | Guide |
| --- | --- | --- |
| PlantUML | `.puml`, `.plantuml` | [Setup & CI/CD](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/plantuml) |
| Mermaid | `.mmd`, `.mermaid` | [Setup & CI/CD](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/mermaid) |
| Graphviz | `.dot`, `.gv` | [Setup & CI/CD](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/graphviz) |
| Draw.io | `.drawio`, `.dio` | [Setup & CI/CD](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/drawio) |
| D2 | `.d2` | [Setup & CI/CD](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/d2) |
| Excalidraw | `.excalidraw` | [Setup & CI/CD](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/excalidraw) |
| BPMN | `.bpmn` | [Setup & CI/CD](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/bpmn) |

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

### 3. CI/CD

Generates a preview on every PR and commits images to `main` on merge.

**Remove the install steps and path filters for providers you don't use** — most teams only need 1–2.

```yaml
name: Generate and Commit Diagrams

# Remove path entries for providers you don't use.
# The workflow only triggers when a matching source file changes.
on:
  pull_request:
    paths:
      # PlantUML — remove if not using .puml / .plantuml files
      - '**/*.puml'
      - '**/*.plantuml'
      # Mermaid — remove if not using .mmd / .mermaid files
      - '**/*.mmd'
      - '**/*.mermaid'
      # Graphviz — remove if not using .dot / .gv files
      - '**/*.dot'
      - '**/*.gv'
      # Draw.io — remove if not using .drawio / .dio files
      - '**/*.drawio'
      - '**/*.dio'
      # D2 — remove if not using .d2 files
      - '**/*.d2'
      # Excalidraw — remove if not using .excalidraw files
      - '**/*.excalidraw'
      # BPMN — remove if not using .bpmn files
      - '**/*.bpmn'
  push:
    branches: [main]
    paths:
      # PlantUML — remove if not using .puml / .plantuml files
      - '**/*.puml'
      - '**/*.plantuml'
      # Mermaid — remove if not using .mmd / .mermaid files
      - '**/*.mmd'
      - '**/*.mermaid'
      # Graphviz — remove if not using .dot / .gv files
      - '**/*.dot'
      - '**/*.gv'
      # Draw.io — remove if not using .drawio / .dio files
      - '**/*.drawio'
      - '**/*.dio'
      # D2 — remove if not using .d2 files
      - '**/*.d2'
      # Excalidraw — remove if not using .excalidraw files
      - '**/*.excalidraw'
      # BPMN — remove if not using .bpmn files
      - '**/*.bpmn'
  workflow_dispatch:

jobs:
  preview:
    name: Generate Preview
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v5

      - name: Setup Node
        uses: actions/setup-node@v5
        with:
          node-version: '20'

      # --- PlantUML — remove if not using .puml / .plantuml files ---
      - name: Install PlantUML
        run: |
          sudo apt-get update -q
          sudo apt-get install -y --no-install-recommends default-jre-headless plantuml

      # --- Mermaid — remove if not using .mmd / .mermaid files ---
      - name: Install Mermaid CLI
        run: npm install -g @mermaid-js/mermaid-cli

      # --- Graphviz — remove if not using .dot / .gv files ---
      - name: Install Graphviz
        run: |
          sudo apt-get update -q
          sudo apt-get install -y graphviz

      # --- Draw.io — remove if not using .drawio / .dio files ---
      - name: Install Draw.io
        run: |
          DRAWIO_VERSION=$(curl -s https://api.github.com/repos/jgraph/drawio-desktop/releases/latest | jq -r '.tag_name | ltrimstr("v")')
          wget -q "https://github.com/jgraph/drawio-desktop/releases/download/v${DRAWIO_VERSION}/drawio-amd64-${DRAWIO_VERSION}.deb" -O drawio.deb
          sudo apt-get install -y ./drawio.deb xvfb

      # --- D2 — remove if not using .d2 files ---
      - name: Install D2
        run: curl -fsSL https://d2lang.com/install.sh | sh

      # --- Excalidraw — remove if not using .excalidraw files ---
      - name: Install Excalidraw CLI
        run: npm install -g @swiftlysingh/excalidraw-cli

      # --- BPMN — remove if not using .bpmn files ---
      - name: Install BPMN CLI
        run: |
          npm install -g bpmn-to-image
          sed -i "s/headless: 'new'/headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox']/" $(npm root -g)/bpmn-to-image/index.js

      - name: Install diagram-sync
        run: npm install -g diagram-sync

      - name: Generate diagrams
        run: diagram-sync
        # add --format png or --format pdf to override the default svg output

      - name: Upload diagram previews
        uses: actions/upload-artifact@v4
        with:
          name: diagrams-preview
          path: diagrams/

  commit:
    name: Generate and Commit
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'

    steps:
      - uses: actions/checkout@v5
        with:
          token: ${{ secrets.PAT_TOKEN }}

      - name: Setup Node
        uses: actions/setup-node@v5
        with:
          node-version: '20'

      # --- PlantUML — remove if not using .puml / .plantuml files ---
      - name: Install PlantUML
        run: |
          sudo apt-get update -q
          sudo apt-get install -y --no-install-recommends default-jre-headless plantuml

      # --- Mermaid — remove if not using .mmd / .mermaid files ---
      - name: Install Mermaid CLI
        run: npm install -g @mermaid-js/mermaid-cli

      # --- Graphviz — remove if not using .dot / .gv files ---
      - name: Install Graphviz
        run: |
          sudo apt-get update -q
          sudo apt-get install -y graphviz

      # --- Draw.io — remove if not using .drawio / .dio files ---
      - name: Install Draw.io
        run: |
          DRAWIO_VERSION=$(curl -s https://api.github.com/repos/jgraph/drawio-desktop/releases/latest | jq -r '.tag_name | ltrimstr("v")')
          wget -q "https://github.com/jgraph/drawio-desktop/releases/download/v${DRAWIO_VERSION}/drawio-amd64-${DRAWIO_VERSION}.deb" -O drawio.deb
          sudo apt-get install -y ./drawio.deb xvfb

      # --- D2 — remove if not using .d2 files ---
      - name: Install D2
        run: curl -fsSL https://d2lang.com/install.sh | sh

      # --- Excalidraw — remove if not using .excalidraw files ---
      - name: Install Excalidraw CLI
        run: npm install -g @swiftlysingh/excalidraw-cli

      # --- BPMN — remove if not using .bpmn files ---
      - name: Install BPMN CLI
        run: |
          npm install -g bpmn-to-image
          sed -i "s/headless: 'new'/headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox']/" $(npm root -g)/bpmn-to-image/index.js

      - name: Install diagram-sync
        run: npm install -g diagram-sync

      - name: Generate diagrams
        run: diagram-sync
        # add --format png or --format pdf to override the default svg output

      - name: Commit generated diagrams
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add diagrams/
          if git diff --staged --quiet; then
            echo "No diagram changes to commit."
          else
            git commit -m "chore: auto-export diagrams [skip ci]"
            git push
          fi
```

Requires a PAT with `contents: write` saved as `PAT_TOKEN` in your repo secrets. See the **[Provider Guides](https://github.com/Buffden/diagram-sync/tree/main/docs/providers)** for the ready-to-use workflow file.

---

## Requirements

- Node.js 20+
- Each provider requires its own CLI tool — install only what you need:
  - **PlantUML:** Java 11+ and PlantUML — see [PlantUML guide](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/plantuml)
  - **Mermaid:** see [Mermaid guide](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/mermaid)
  - **Graphviz:** see [Graphviz guide](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/graphviz)
  - **Draw.io:** requires `draw.io` and `xvfb` (Linux only) — `diagram-sync` auto-uses `xvfb-run` for headless rendering when no display is available — see [Draw.io guide](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/drawio)
  - **D2:** see [D2 guide](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/d2)
  - **Excalidraw:** requires `@swiftlysingh/excalidraw-cli` — SVG and PNG, no browser required — see [Excalidraw guide](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/excalidraw)
  - **BPMN:** requires `bpmn-to-image` — SVG, PNG and PDF — on CI, patch with `--no-sandbox` after install (see [BPMN guide](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/bpmn))

Providers are detected at runtime and missing ones are skipped with a warning.

---

## Common Use Cases

- **How to automate PlantUML diagram generation in CI/CD**
- **How to automate Mermaid diagram generation in CI/CD**
- **How to automate Graphviz diagram generation in CI/CD**
- **How to convert Draw.io files to images automatically in CI/CD**
- **How to automate D2 diagram generation in CI/CD**
- **How to export Excalidraw files to SVG or PNG automatically in CI/CD**
- **How to automate BPMN process diagram generation in CI/CD**
- **How to keep README architecture diagrams up to date automatically**
- **How to sync architecture diagrams from source files**
- **How to generate architecture diagrams on GitHub Actions**
- **How to treat architecture diagrams as code**
- **Documentation-as-code workflow for PlantUML, Mermaid, D2, and more**

---

## Links

- **npm:** [https://www.npmjs.com/package/diagram-sync](https://www.npmjs.com/package/diagram-sync)
- **GitHub:** [https://github.com/Buffden/diagram-sync](https://github.com/Buffden/diagram-sync)
- **Provider Guides:** [https://github.com/Buffden/diagram-sync/tree/main/docs/providers](https://github.com/Buffden/diagram-sync/tree/main/docs/providers)

---

## License

MIT — [Buffden](https://buffden.com)
