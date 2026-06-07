# BPMN Provider

Renders `.bpmn` files using `bpmn-to-image` with headless Chromium via Puppeteer. Output format is configurable — defaults to `png`.

---

## Installation

### macOS & Linux (local)

```bash
npm install -g bpmn-to-image
```

> **Note:** `diagram-sync` resolves the binary via `npm config get prefix` so it works even if the global npm bin is not in your PATH.

### CI/CD (Ubuntu / GitHub Actions)

`bpmn-to-image` uses Puppeteer/Chromium without `--no-sandbox` by default, which causes a `SIGSYS` crash in sandboxed CI environments. Patch it after install:

```bash
npm install -g bpmn-to-image
sed -i "s/headless: 'new'/headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox']/" $(npm root -g)/bpmn-to-image/index.js
```

### Windows

```bash
npm install -g bpmn-to-image
```

---

## Supported Extensions

| Extension | Description |
| --- | --- |
| `.bpmn` | BPMN 2.0 process diagram file |

---

## Supported Output Formats

`png` `pdf`

Default is `png`. SVG is not supported by `bpmn-to-image`.

---

## Output

Images generated under `diagrams/`, mirroring the source path.

```text
src/payments/checkout.bpmn     →  diagrams/src/payments/checkout.png
docs/processes/onboarding.bpmn →  diagrams/docs/processes/onboarding.png
```

---

## Config

No config required. BPMN files are discovered and rendered automatically in `png`.

To set format per job:

```json
{
  "jobs": [
    {
      "name": "processes",
      "type": "bpmn",
      "format": "pdf"
    }
  ]
}
```

To override at runtime:

```bash
npx diagram-sync --format pdf
```

Format resolution order: `--format` flag → job `format` → global `format` → default `png`.

---

## CI/CD

Copy [`workflow.yml`](../workflow.yml) into `.github/workflows/` in your repo. It generates images on every push and commits them back automatically.

Requires a Personal Access Token (PAT) with `contents: write` permission saved as a repository secret named `PAT_TOKEN`. [How to create a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

---

## Notes

- If `bpmn-to-image` is not found, `diagram-sync` skips BPMN files with a clear install hint and continues
- `diagram-sync` resolves the binary path via `npm config get prefix` — works even when the npm global bin is not in PATH
- Uses headless Chromium via Puppeteer — no display server required
- Only `png` and `pdf` output are supported — this is a limitation of `bpmn-to-image`
- On CI (GitHub Actions, Ubuntu), patch `bpmn-to-image` with `--no-sandbox` after install to prevent `SIGSYS` sandbox crashes — see the CI/CD install section above
- BPMN source files must include a `<bpmndi:BPMNDiagram>` section with layout coordinates — bpmn-js will throw "no diagram to display" without it
- BPMN files can be created using [Camunda Modeler](https://camunda.com/download/modeler/), the VS Code BPMN editor, or by hand
