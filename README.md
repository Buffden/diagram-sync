# diagram-sync

> Keep architecture diagrams synchronized with source code.

[![npm version](https://img.shields.io/npm/v/diagram-sync)](https://www.npmjs.com/package/diagram-sync)
[![npm downloads](https://img.shields.io/npm/dt/diagram-sync)](https://www.npmjs.com/package/diagram-sync)
[![license](https://img.shields.io/npm/l/diagram-sync)](./LICENSE)
[![coverage](https://coveralls.io/repos/github/Buffden/diagram-sync/badge.svg?branch=main)](https://coveralls.io/github/Buffden/diagram-sync?branch=main)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Buffden_diagram-sync&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Buffden_diagram-sync)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=Buffden_diagram-sync&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=Buffden_diagram-sync)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Buffden_diagram-sync&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=Buffden_diagram-sync)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Buffden_diagram-sync&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=Buffden_diagram-sync)

`diagram-sync` is a CLI tool that automatically generates images from diagram source files. Drop it into any repo and run `npx diagram-sync` — it finds every supported diagram file, renders it to an image, and mirrors the output under a `diagrams/` folder. No config required.

```bash
npx diagram-sync
```

![demo](https://raw.githubusercontent.com/Buffden/diagram-sync/main/docs/demo.gif)

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

| Source | Generated |
| --- | --- |
| <pre>docs/<br>└── providers/<br>    ├── plantuml/<br>    │   └── system.puml<br>    └── mermaid/<br>        └── auth.mmd</pre> | <pre>diagrams/<br>└── docs/<br>    └── providers/<br>        ├── plantuml/<br>        │   └── system.svg<br>        └── mermaid/<br>            └── auth.svg</pre> |

Once committed, the generated images are plain files in your repository — embed them in READMEs, wikis, internal docs, or link to them from anywhere on the internet via their raw GitHub URL.

---

## How It Works

- Recursively scans your repo for diagram source files
- Skips `node_modules`, `.git`, `dist`, `build`, `diagrams`
- Derives the output path from the source file location — no input/output directories to configure
- Generates images using the installed diagram tool for each provider — defaults to SVG, configurable via `--format` flag or config file

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

![demo](https://raw.githubusercontent.com/Buffden/diagram-sync/main/docs/demo.gif)

### 2. npm script

```json
"scripts": {
  "diagrams": "npx diagram-sync"
}
```

```bash
npm run diagrams
```

![demo-npm](https://raw.githubusercontent.com/Buffden/diagram-sync/main/docs/demo-npm.gif)

### 3. Regenerate specific files only

Pass explicit paths — skips discovery entirely. Used by CI to regenerate only the files changed in a push or PR.

```bash
npx diagram-sync --files docs/providers/d2/network.d2 docs/providers/plantuml/system.puml
```

![demo-files](https://raw.githubusercontent.com/Buffden/diagram-sync/main/docs/demo-files.gif)

### 4. Regenerate only locally changed files

Processes only files modified since the last commit (`git diff HEAD` + untracked). Useful locally to avoid regenerating every diagram in a large repo.

```bash
npx diagram-sync --changed
```

![demo-changed](https://raw.githubusercontent.com/Buffden/diagram-sync/main/docs/demo-changed.gif)

#### Exit codes and output names

`diagram-sync` exits with code 1 if any diagram fails to render, including a missing provider tool or a source file that doesn't exist, so CI jobs fail instead of passing silently.

Each source `path/to/name.ext` is written to `diagrams/path/to/name.<format>`, whatever title the diagram declares (for example `@startuml My Title`). If two sources in one folder share a name, such as `architecture.puml` and `architecture.excalidraw`, they write the same file; diagram-sync warns about it, and you should rename one of them.

### 5. Config file

Config is optional — no config file needed to get started. Add `diagram-sync.config.json` to your project root to control formats per provider or scope which providers run.

```json
{
  "format": "svg",
  "jobs": [
    {
      "name": "architecture",
      "type": "plantuml",
      "format": "png",
      "background": "#FFFFFF"
    },
    {
      "name": "flows",
      "type": "mermaid"
    }
  ]
}
```

```bash
npx diagram-sync --config diagram-sync.config.json
```

Override format at runtime without a config file:

```bash
npx diagram-sync --format svg
```

Format resolution order: `--format` flag → job `format` → global `format` → default `svg`.

![demo-config](https://raw.githubusercontent.com/Buffden/diagram-sync/main/docs/demo-config.gif)

#### Job Options

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | Label for the job (used in logs) |
| `type` | `string` | Diagram provider (`plantuml`, `mermaid`, `graphviz`, `drawio`, `d2`, `excalidraw`, `bpmn`) |
| `format` | `string` | Output format for this job (e.g. `png`, `svg`, `pdf`) — overrides global format |
| `background` | `string` | Background color for PlantUML diagrams — defaults to `#FFFFFF`. Accepts hex codes or named colors (e.g. `transparent`, `#F5F5F5`) |

### 6. CI/CD

Generates a preview on every PR and commits images to `main` on merge.

Copy the workflow below to `.github/workflows/diagrams.yml` as-is. It works out which diagrams changed and **installs only the renderers those diagrams need**, so a PR that touches one `.mmd` file installs only Mermaid. Each provider's install step is a self-contained `── <Provider>` block, so you can delete the ones you'll never use. Manual runs (`workflow_dispatch`) re-render every diagram.

```yaml
name: Diagrams

# Renders diagram sources to images with diagram-sync:
#   - pull requests: renders the changed diagrams and uploads them as a preview artifact
#   - pushes to main: renders the changed diagrams and commits them to diagrams/
#   - manual run:     renders every diagram and commits the result
#
# Copy this file to .github/workflows/diagrams.yml as-is. Each renderer below is
# installed only when a diagram of that type is being rendered, so providers you
# don't use cost nothing. To trim the file anyway, delete the "── <Provider>"
# blocks you'll never need; every block is self-contained.

on:
  pull_request:
    # Keep this list the same as the push paths below.
    paths:
      - '**/*.puml'        # PlantUML
      - '**/*.plantuml'    # PlantUML
      - '**/*.mmd'         # Mermaid
      - '**/*.mermaid'     # Mermaid
      - '**/*.dot'         # Graphviz
      - '**/*.gv'          # Graphviz
      - '**/*.drawio'      # Draw.io
      - '**/*.dio'         # Draw.io
      - '**/*.d2'          # D2
      - '**/*.excalidraw'  # Excalidraw
      - '**/*.bpmn'        # BPMN
  push:
    branches: [main]
    paths:
      - '**/*.puml'        # PlantUML
      - '**/*.plantuml'    # PlantUML
      - '**/*.mmd'         # Mermaid
      - '**/*.mermaid'     # Mermaid
      - '**/*.dot'         # Graphviz
      - '**/*.gv'          # Graphviz
      - '**/*.drawio'      # Draw.io
      - '**/*.dio'         # Draw.io
      - '**/*.d2'          # D2
      - '**/*.excalidraw'  # Excalidraw
      - '**/*.bpmn'        # BPMN
  workflow_dispatch:

jobs:
  diagrams:
    name: Generate diagrams
    runs-on: ubuntu-latest
    permissions:
      contents: write  # to commit rendered images on push / manual runs

    steps:
      - uses: actions/checkout@v7
        with:
          # GITHUB_TOKEN with contents: write is enough when main is unprotected.
          # If a branch ruleset blocks pushes from GITHUB_TOKEN, save a fine-grained PAT
          # (Contents: read+write) as PAT_TOKEN; it is used automatically when present.
          token: ${{ secrets.PAT_TOKEN || secrets.GITHUB_TOKEN }}
          # Full history so git diff can resolve the base / previous commit.
          fetch-depth: 0

      # Node 22: mermaid-cli 12 requires >=22.13 (excalidraw-cli >=20.19).
      - uses: actions/setup-node@v7
        with:
          node-version: '22'

      # Works out which diagrams to render and which providers they need. Sets one
      # output per provider (plantuml=true, ...) that the install steps check.
      # Paths are NUL-separated end to end so file names with spaces survive.
      - name: Find diagrams to render
        id: find
        env:
          EVENT_NAME: ${{ github.event_name }}
          BASE_REF: ${{ github.base_ref }}
          BEFORE_SHA: ${{ github.event.before }}
          AFTER_SHA: ${{ github.sha }}
        run: |
          declare -A EXTENSIONS=(
            [plantuml]='puml|plantuml'
            [mermaid]='mmd|mermaid'
            [graphviz]='dot|gv'
            [drawio]='drawio|dio'
            [d2]='d2'
            [excalidraw]='excalidraw'
            [bpmn]='bpmn'
          )
          pattern="\.($(IFS='|'; echo "${EXTENSIONS[*]}"))$"
          candidates="$RUNNER_TEMP/candidates"
          list="$RUNNER_TEMP/diagrams.list"

          # Render everything on manual runs and on the first push of a branch
          # (no previous commit to diff against); otherwise only what changed.
          mode=changed
          if [ "$EVENT_NAME" = "pull_request" ]; then
            git diff -z --name-only --diff-filter=d "origin/${BASE_REF}...HEAD" > "$candidates"
          elif [ "$EVENT_NAME" = "push" ] && [ -n "$BEFORE_SHA" ] && [ "$BEFORE_SHA" != "0000000000000000000000000000000000000000" ]; then
            git diff -z --name-only --diff-filter=d "$BEFORE_SHA" "$AFTER_SHA" > "$candidates"
          else
            mode=all
            git ls-files -z > "$candidates"
          fi

          grep -zE "$pattern" "$candidates" > "$list" || true
          echo "mode=$mode" >> "$GITHUB_OUTPUT"
          if [ ! -s "$list" ]; then
            echo "No diagram files to render."
            exit 0
          fi
          echo "any=true" >> "$GITHUB_OUTPUT"
          echo "Diagrams to render ($mode):"
          tr '\0' '\n' < "$list"
          for provider in "${!EXTENSIONS[@]}"; do
            if grep -qzE "\.(${EXTENSIONS[$provider]})$" "$list"; then
              echo "$provider=true" >> "$GITHUB_OUTPUT"
            fi
          done

      # ── PlantUML (.puml, .plantuml) ──────────────────────────────────────────
      # Graphviz is needed for every PlantUML diagram type except sequence diagrams.
      - name: Install PlantUML
        if: steps.find.outputs.plantuml == 'true'
        run: |
          sudo apt-get update -q
          sudo apt-get install -y --no-install-recommends default-jre-headless plantuml graphviz

      # ── Mermaid (.mmd, .mermaid) ─────────────────────────────────────────────
      # Pinned version, installed with --ignore-scripts so no dependency hook runs.
      # Then only Puppeteer's own postinstall runs, to download the headless Chrome
      # that mermaid-cli renders with.
      - name: Install Mermaid CLI
        if: steps.find.outputs.mermaid == 'true'
        run: |
          npm install -g --ignore-scripts @mermaid-js/mermaid-cli@12.2.0
          (cd "$(npm root -g)/@mermaid-js/mermaid-cli/node_modules/puppeteer" && node install.mjs)

      # ── Graphviz (.dot, .gv) ─────────────────────────────────────────────────
      - name: Install Graphviz
        if: steps.find.outputs.graphviz == 'true'
        run: |
          sudo apt-get update -q
          sudo apt-get install -y --no-install-recommends graphviz

      # ── Draw.io (.drawio, .dio) ──────────────────────────────────────────────
      # Pinned version + SHA-256 (from the release's Files-SHA256-Hashes.txt).
      # When bumping DRAWIO_VERSION, update DRAWIO_SHA256 to match. xvfb gives
      # draw.io a virtual display; diagram-sync uses xvfb-run automatically.
      - name: Install Draw.io
        if: steps.find.outputs.drawio == 'true'
        env:
          DRAWIO_VERSION: '30.3.6'
          DRAWIO_SHA256: '4df35ffe4cd7b2652771d9e55fc4e0ad4fb7bf55fbfab303da7c86b83af2dd82'
        run: |
          curl -fsSL --proto '=https' --proto-redir '=https' --tlsv1.2 -o "$RUNNER_TEMP/drawio.deb" \
            "https://github.com/jgraph/drawio-desktop/releases/download/v${DRAWIO_VERSION}/drawio-amd64-${DRAWIO_VERSION}.deb"
          echo "${DRAWIO_SHA256}  $RUNNER_TEMP/drawio.deb" | sha256sum -c -
          sudo apt-get update -q
          sudo apt-get install -y "$RUNNER_TEMP/drawio.deb" xvfb

      # ── D2 (.d2) ─────────────────────────────────────────────────────────────
      # Pinned release tarball + SHA-256 instead of `curl install.sh | sh`: nothing
      # unverified is executed, and no GitHub API call (which is rate-limited).
      # When bumping D2_VERSION, update D2_SHA256 to match.
      - name: Install D2
        if: steps.find.outputs.d2 == 'true'
        env:
          D2_VERSION: '0.9.0'
          D2_SHA256: '5669ddc46b99e942cc96078f4a4e36d5e62103348f4c05179ede27802fdd87a9'
        run: |
          curl -fsSL --proto '=https' --proto-redir '=https' --tlsv1.2 -o "$RUNNER_TEMP/d2.tar.gz" \
            "https://github.com/terrastruct/d2/releases/download/v${D2_VERSION}/d2-v${D2_VERSION}-linux-amd64.tar.gz"
          echo "${D2_SHA256}  $RUNNER_TEMP/d2.tar.gz" | sha256sum -c -
          tar -xzf "$RUNNER_TEMP/d2.tar.gz" -C "$RUNNER_TEMP"
          sudo install -m 0755 "$RUNNER_TEMP/d2-v${D2_VERSION}/bin/d2" /usr/local/bin/d2
          d2 --version

      # ── Excalidraw (.excalidraw) ─────────────────────────────────────────────
      # Pinned version; --ignore-scripts because no dependency needs an install hook.
      - name: Install Excalidraw CLI
        if: steps.find.outputs.excalidraw == 'true'
        run: npm install -g --ignore-scripts @swiftlysingh/excalidraw-cli@1.5.0

      # ── BPMN (.bpmn) ─────────────────────────────────────────────────────────
      # Pinned version, installed with --ignore-scripts so no dependency hook runs.
      # Then only Puppeteer's own postinstall runs, to download the headless Chrome
      # that bpmn-to-image renders with. The sed patch lets Chrome run as root on CI.
      - name: Install BPMN CLI
        if: steps.find.outputs.bpmn == 'true'
        run: |
          npm install -g --ignore-scripts bpmn-to-image@0.10.0
          (cd "$(npm root -g)/bpmn-to-image/node_modules/puppeteer" && node install.mjs)
          sed -i "s/headless: 'new'/headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox']/" "$(npm root -g)/bpmn-to-image/index.js"

      # ─────────────────────────────────────────────────────────────────────────

      - name: Install diagram-sync
        if: steps.find.outputs.any == 'true'
        run: npm install -g --ignore-scripts diagram-sync@3

      # continue-on-error so one broken diagram doesn't stop the others from being
      # previewed / committed. The last step still fails the job if this failed.
      # Add --format png or --format pdf to override the default svg output.
      - name: Generate diagrams
        id: render
        if: steps.find.outputs.any == 'true'
        continue-on-error: true
        env:
          MODE: ${{ steps.find.outputs.mode }}
        run: |
          if [ "$MODE" = "all" ]; then
            diagram-sync
          else
            xargs -0 -r diagram-sync --files < "$RUNNER_TEMP/diagrams.list"
          fi

      - name: Upload diagram previews
        if: github.event_name == 'pull_request' && steps.find.outputs.any == 'true'
        uses: actions/upload-artifact@v7
        with:
          name: diagrams-preview
          path: diagrams/
          if-no-files-found: ignore

      - name: Commit generated diagrams
        if: github.event_name != 'pull_request' && steps.find.outputs.any == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          # diagrams/ may not exist yet if nothing has been generated
          git add diagrams/ 2>/dev/null || true
          if git diff --staged --quiet; then
            echo "No diagram changes to commit."
          else
            git commit -m "chore: auto-export diagrams [skip ci]"
            # main may have moved while diagrams were rendering
            git pull --rebase origin main
            git push
          fi

      # outcome, not conclusion: continue-on-error turns the conclusion into success
      - name: Fail if any diagram failed to render
        if: steps.render.outcome == 'failure'
        run: |
          echo "::error::Some diagrams failed to render. The rest were still previewed / committed; see the Generate diagrams step for details."
          exit 1
```

No secrets setup required — `GITHUB_TOKEN` with `contents: write` works out of the box for unprotected branches. If your main branch is protected and blocks pushes from `GITHUB_TOKEN`, save a fine-grained PAT (Contents: read and write) as the `PAT_TOKEN` secret; the workflow picks it up automatically. See the **[Provider Guides](https://github.com/Buffden/diagram-sync/tree/main/docs/providers)** for the ready-to-use workflow file.

---

## Requirements

- Node.js 20+
- Each provider requires its own CLI tool — install only what you need:
  - **PlantUML:** Java 11+, PlantUML, and Graphviz (needed for every diagram type except sequence diagrams) — see [PlantUML guide](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/plantuml)
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
