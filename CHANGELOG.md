# Changelog

All notable changes to this project will be documented here.

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
