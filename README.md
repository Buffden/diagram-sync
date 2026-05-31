# diagram-sync

> Keep architecture diagrams synchronized with source code.

`diagram-sync` is a CLI tool that automatically generates SVG files from diagram source files (PlantUML, and more in the future). It removes the manual export step so your README, wiki, and documentation always reflect the latest diagram sources.

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

1. Add a config file to your project root:

```json
{
  "defaultFormat": "svg",
  "recursive": true,
  "jobs": [
    {
      "name": "architecture-diagrams",
      "type": "plantuml",
      "input": "docs/diagrams",
      "output": "docs/generated"
    }
  ]
}
```

2. Run:

```bash
npx diagram-sync
```

Your `.puml` files in `docs/diagrams` will be rendered as SVGs into `docs/generated`.

---

## Configuration

### Options

| Field | Type | Default | Description |
|---|---|---|---|
| `defaultFormat` | `string` | `"svg"` | Output format (`svg`) |
| `recursive` | `boolean` | `true` | Recursively discover source files |
| `cleanOutput` | `boolean` | `false` | Clear output directory before generation |
| `jobs` | `array` | required | List of diagram generation jobs |

### Job Options

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Label for the job (used in logs) |
| `type` | `string` | Diagram provider (`plantuml`) |
| `input` | `string` | Path to source diagram files |
| `output` | `string` | Path for generated output files |
| `format` | `string` | Override `defaultFormat` per job |

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

Source file:

```
docs/diagrams/payment-flow.puml
```

Generated output:

```
docs/generated/payment-flow.svg
```

Reference it in your README:

```markdown
![Payment Flow](docs/generated/payment-flow.svg)
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
- Java (required by PlantUML)

---

## License

MIT
