# Excalidraw Provider

Renders `.excalidraw` files using `@swiftlysingh/excalidraw-cli`. Output format is configurable — defaults to `svg`. Works on macOS, Linux, and Windows with no browser or Playwright required.

---

## Installation

### macOS, Linux & Windows

```bash
npm install -g @swiftlysingh/excalidraw-cli
```

> **Note:** `diagram-sync` resolves the binary via `npm config get prefix` so it works even if the global npm bin is not in your PATH.

---

## Supported Extensions

| Extension | Description |
| --- | --- |
| `.excalidraw` | Excalidraw diagram file |

---

## Supported Output Formats

All formats are fully supported. Default is `svg`.

`svg` `png`

---

## Output

Images generated under `diagrams/`, mirroring the source path.

```text
docs/architecture/system.excalidraw  →  diagrams/docs/architecture/system.svg
src/flows/auth.excalidraw            →  diagrams/src/flows/auth.svg
```

---

## Config

No config required. Excalidraw files are discovered and rendered automatically in `svg`.

To set a global output format:

```json
{
  "format": "png"
}
```

To set format per job:

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

To override at runtime:

```bash
npx diagram-sync --format png
```

Format resolution order: `--format` flag → job `format` → global `format` → default `svg`.

---

## CI/CD

Copy [`workflow.yml`](../../workflow.yml) into `.github/workflows/` in your repo. It generates images on every push and commits them back automatically.

Requires a Personal Access Token (PAT) with `contents: write` permission saved as a repository secret named `PAT_TOKEN`. [How to create a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

---

## Notes

- If `excalidraw-cli` is not found, `diagram-sync` skips Excalidraw files with a clear install hint and continues
- `diagram-sync` resolves the binary path via `npm config get prefix` — works even when the npm global bin is not in PATH
- No browser or Playwright required — pure Node.js rendering
- Works on macOS, Linux, and Windows
- Excalidraw files can be created using the [Excalidraw web app](https://excalidraw.com), the VS Code extension, or by hand
