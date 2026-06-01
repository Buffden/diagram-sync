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

## CI/CD Usage

Run `diagram-sync` as part of your pipeline to regenerate diagrams on every push:

```yaml
- name: Generate diagrams
  run: npx diagram-sync --config diagram-sync.config.json
```

Future versions will support a staleness check — failing the build when source files have changed but outputs have not been regenerated.

---

## Requirements

- Node.js 18+
- Java
- plantuml (`brew install plantuml` or `apt install plantuml`)

---

## License

MIT
