# Excalidraw Provider

Renders `.excalidraw` files using `excalidraw-export-cli` with headless Chromium via Playwright. Output format is PNG only.

---

## Installation

### macOS & Linux

```bash
npm install -g excalidraw-export-cli
npx playwright install chromium
```

> **Note:** `diagram-sync` resolves the binary via `npm config get prefix` so it works even if the global npm bin is not in your PATH.

### Windows

```bash
npm install -g excalidraw-export-cli
npx playwright install chromium
```

---

## Supported Extensions

| Extension | Description |
| --- | --- |
| `.excalidraw` | Excalidraw diagram file |

---

## Supported Output Formats

PNG only — this is a limitation of `excalidraw-export-cli`.

`png`

---

## Output

Images generated under `diagrams/`, mirroring the source path.

```text
docs/architecture/system.excalidraw  →  diagrams/docs/architecture/system.png
src/flows/auth.excalidraw            →  diagrams/src/flows/auth.png
```

---

## Config

Excalidraw files are discovered and rendered automatically. No config required.

To set format per job (PNG is the only supported format):

```json
{
  "jobs": [
    {
      "name": "diagrams",
      "type": "excalidraw",
      "format": "png"
    }
  ]
}
```

---

## CI/CD

Copy [`workflow.yml`](../workflow.yml) into `.github/workflows/` in your repo. It generates images on every push and commits them back automatically.

Requires a Personal Access Token (PAT) with `contents: write` permission saved as a repository secret named `PAT_TOKEN`. [How to create a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

---

## Notes

- If `excalidraw-export` is not found, `diagram-sync` skips Excalidraw files with a clear install hint and continues
- `diagram-sync` resolves the binary path via `npm config get prefix` — works even when the npm global bin is not in PATH
- Uses headless Chromium via Playwright — no display server required
- Only PNG output is supported — this is a limitation of `excalidraw-export-cli`, not `diagram-sync`
- Excalidraw files can be created using the [Excalidraw web app](https://excalidraw.com), the VS Code extension, or by hand
