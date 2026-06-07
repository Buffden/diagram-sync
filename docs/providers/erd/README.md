# ERD Provider

Renders `.er` files using the `erd` CLI. Output format is configurable — defaults to `svg`. Requires Graphviz.

---

## Installation

### macOS

```bash
brew install erd
```

> `erd` uses Graphviz under the hood. Install it if not already present: `brew install graphviz`

### Linux (Debian/Ubuntu)

Download the pre-built binary from the [erd releases page](https://github.com/BurntSushi/erd/releases):

```bash
ERD_VERSION=$(curl -s https://api.github.com/repos/BurntSushi/erd/releases/latest | jq -r '.tag_name')
wget -q "https://github.com/BurntSushi/erd/releases/download/${ERD_VERSION}/erd-${ERD_VERSION}-linux.tar.gz" -O erd.tar.gz
tar -xzf erd.tar.gz
sudo mv erd /usr/local/bin/erd
sudo apt-get install -y graphviz
```

### Windows

Download from the [erd releases page](https://github.com/BurntSushi/erd/releases) and ensure `erd` is on your PATH.

---

## Supported Extensions

| Extension | Description |
| --- | --- |
| `.er` | ERD source file (erd tool format) |

---

## Supported Output Formats

All formats are fully supported. Default is `svg`.

`svg` `png` `pdf`

---

## Output

Images generated under `diagrams/`, mirroring the source path.

```text
src/db/schema.er          →  diagrams/src/db/schema.svg
docs/architecture/data.er →  diagrams/docs/architecture/data.svg
```

---

## Config

No config required. ERD files are discovered and rendered automatically in `svg`.

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
      "name": "database",
      "type": "erd",
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

Copy [`workflow.yml`](../workflow.yml) into `.github/workflows/` in your repo. It generates images on every push and commits them back automatically.

Requires a Personal Access Token (PAT) with `contents: write` permission saved as a repository secret named `PAT_TOKEN`. [How to create a PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

---

## Notes

- If `erd` is not found, `diagram-sync` skips ERD files with a warning and continues
- Requires Graphviz (`dot`) — install it alongside `erd`
- ERD files use the format defined by the [BurntSushi/erd](https://github.com/BurntSushi/erd) tool — see the repo for syntax reference
- ERD files can be created by hand or generated from database introspection tools
