# Changelog

All notable changes to this project will be documented here.

---

## [3.4.0] — 2026-06-07

### Added

- BPMN provider: supports `.bpmn` files via `bpmn-to-image` with headless Chromium — `png` and `pdf` only — defaults to `png`
- ERD provider: supports `.er` files via the `erd` CLI — formats: `svg`, `png`, `pdf` — defaults to `svg` — requires Graphviz
- BPMN binary resolution via `npm config get prefix` — works even when the npm global bin is not in `PATH`
- Provider docs for [BPMN](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/bpmn) and [ERD](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/erd)

---

## [3.3.0] — 2026-06-07

### Added

- D2 provider: supports `.d2` files via the `d2` CLI — formats: `svg`, `png` — defaults to `svg`
- Excalidraw provider: supports `.excalidraw` files via `excalidraw-export-cli` with headless Chromium — PNG only
- Excalidraw binary resolution via `npm config get prefix` — works even when the npm global bin is not in `PATH`
- Provider docs for [D2](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/d2) and [Excalidraw](https://github.com/Buffden/diagram-sync/tree/main/docs/providers/excalidraw)

---

## [3.2.1] — 2026-06-07

### Fixed

- Draw.io headless rendering on Linux — `diagram-sync` now automatically uses `xvfb-run` when no `$DISPLAY` is available (e.g. GitHub Actions), eliminating the `Missing X server or $DISPLAY` crash
- If `xvfb-run` is not installed, `diagram-sync` skips Draw.io files with a clear install hint instead of crashing with Electron errors
- `--no-sandbox` and `--disable-gpu` are now always passed to `drawio`, not just in CI environments

---

## [3.2.0] — 2026-06-07

### Added

- Draw.io provider: supports `.drawio` and `.dio` files via the `drawio` CLI
- Draw.io output formats: `svg`, `png`, `jpg`, `jpeg`, `pdf` — defaults to `svg`

---

## [3.1.0] — 2026-06-05

### Added

- Graphviz provider: supports `.dot` and `.gv` files via the `dot` CLI
- Graphviz output formats: `png`, `svg`, `eps`, `pdf`, `jpg`, `jpeg`, `gif` — defaults to `svg`

---

## [3.0.0] — 2026-06-04

### Changed

- Default output format reverted to **SVG** (was changed to PNG in 2.0.0). SVG is the recommended format — scalable, smaller, and renderable inline in GitHub READMEs.

**Migration:** If you relied on PNG output without explicit config, add `"format": "png"` to your `diagram-sync.config.json` or run with `--format png`.

---

## [2.0.2] — 2026-06-03

### Fixed

- Mermaid CLI automatically uses `--no-sandbox` when running in CI environments — no manual workflow workaround needed

---

## [2.0.1] — 2026-06-03

### Fixed

- PlantUML availability check no longer fails when Graphviz is not installed — `plantuml` exits with code 250 in this case but is otherwise fully functional

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
- npm publishing ready: MIT license, Node 20+
