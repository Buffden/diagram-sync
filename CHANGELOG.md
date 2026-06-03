# Changelog

All notable changes to this project will be documented here.

---

## [2.0.0] — 2026-06-03

### Breaking Changes

- Default output format changed from SVG to **PNG**. Any references to generated images in READMEs or docs that use `.svg` paths must be updated to `.png` (or the appropriate format).

**Migration:** If you relied on SVG output without explicit config, add `"format": "svg"` to your `diagram-sync.config.json` or run with `--format svg`.

### Added

- Configurable output format for all providers via `--format` CLI flag, global `format` config field, or per-job `format` field
- Format resolution chain: `--format` flag → job `format` → global `format` → default `png`
- PlantUML supports: `png`, `svg`, `eps`, `pdf`
- Mermaid supports: `png`, `svg`, `pdf`
- Using an unsupported format explicitly (via flag or config) is a hard error; falling back from an unsupported default produces a warning and uses the provider's own default instead

---

## [1.1.0] — 2026-06-01

### Added

- Mermaid support: `.mmd` and `.mermaid` files are now discovered and rendered using the Mermaid CLI (`mmdc`)
- Runtime provider detection: missing providers (PlantUML or Mermaid CLI) are skipped with a warning rather than crashing
- Default config now auto-includes all registered providers — no config file required to use both PlantUML and Mermaid
- Config merging: user-defined jobs are supplemented by any provider not already listed in the config

---

## [1.0.0] — 2026-06-01

### Initial release

- PlantUML support: `.puml` and `.plantuml` files rendered to SVG via `plantuml`
- Recursive file discovery across the entire repo
- Auto path mirroring — output location derived from source file path under `diagrams/`
- Ignores `node_modules`, `.git`, `dist`, `build`, `diagrams`
- Optional `diagram-sync.config.json` with job-based configuration
- `--config` CLI flag
- npm publishing ready: MIT license, Node 18+
