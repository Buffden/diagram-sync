import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

vi.mock('child_process');

import { discoverFiles, discoverChangedFiles } from '../discover';
import { type Config } from '../config';

const mockSpawnSync = vi.mocked(spawnSync);

function makeConfig(types: string[]): Config {
	return { jobs: types.map((t) => ({ name: t, type: t })) };
}

describe('discoverFiles', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diagram-sync-discover-'));
		mockSpawnSync.mockReset();
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true });
	});

	it('finds .puml files', () => {
		fs.writeFileSync(path.join(tmpDir, 'flow.puml'), '@startuml\n@enduml');
		const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/flow\.puml$/);
	});

	it('finds .mmd files', () => {
		fs.writeFileSync(path.join(tmpDir, 'flow.mmd'), 'graph TD');
		const files = discoverFiles(tmpDir, makeConfig(['mermaid']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/flow\.mmd$/);
	});

	it('finds .mermaid files', () => {
		fs.writeFileSync(path.join(tmpDir, 'chart.mermaid'), 'graph LR');
		const files = discoverFiles(tmpDir, makeConfig(['mermaid']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/chart\.mermaid$/);
	});

	it('finds .plantuml files', () => {
		fs.writeFileSync(path.join(tmpDir, 'arch.plantuml'), '@startuml\n@enduml');
		const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/arch\.plantuml$/);
	});

	it('finds .dot files', () => {
		fs.writeFileSync(path.join(tmpDir, 'arch.dot'), 'digraph {}');
		const files = discoverFiles(tmpDir, makeConfig(['graphviz']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/arch\.dot$/);
	});

	it('finds .gv files', () => {
		fs.writeFileSync(path.join(tmpDir, 'pipeline.gv'), 'digraph {}');
		const files = discoverFiles(tmpDir, makeConfig(['graphviz']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/pipeline\.gv$/);
	});

	it('finds .drawio files', () => {
		fs.writeFileSync(path.join(tmpDir, 'arch.drawio'), '<mxfile/>');
		const files = discoverFiles(tmpDir, makeConfig(['drawio']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/arch\.drawio$/);
	});

	it('finds .dio files', () => {
		fs.writeFileSync(path.join(tmpDir, 'flow.dio'), '<mxfile/>');
		const files = discoverFiles(tmpDir, makeConfig(['drawio']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/flow\.dio$/);
	});

	it('finds .d2 files', () => {
		fs.writeFileSync(path.join(tmpDir, 'system.d2'), 'x -> y');
		const files = discoverFiles(tmpDir, makeConfig(['d2']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/system\.d2$/);
	});

	it('finds .excalidraw files', () => {
		fs.writeFileSync(path.join(tmpDir, 'sketch.excalidraw'), '{}');
		const files = discoverFiles(tmpDir, makeConfig(['excalidraw']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/sketch\.excalidraw$/);
	});

	it('finds .bpmn files', () => {
		fs.writeFileSync(path.join(tmpDir, 'process.bpmn'), '<definitions/>');
		const files = discoverFiles(tmpDir, makeConfig(['bpmn']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/process\.bpmn$/);
	});

	it('finds files in subdirectories', () => {
		const subDir = path.join(tmpDir, 'src', 'flows');
		fs.mkdirSync(subDir, { recursive: true });
		fs.writeFileSync(path.join(subDir, 'auth.puml'), '@startuml\n@enduml');
		const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(1);
		expect(files[0]).toContain(path.join('src', 'flows', 'auth.puml'));
	});

	it('ignores node_modules', () => {
		const nm = path.join(tmpDir, 'node_modules', 'some-pkg');
		fs.mkdirSync(nm, { recursive: true });
		fs.writeFileSync(path.join(nm, 'flow.puml'), '@startuml\n@enduml');
		const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(0);
	});

	it('ignores diagrams directory', () => {
		const diagrams = path.join(tmpDir, 'diagrams');
		fs.mkdirSync(diagrams);
		fs.writeFileSync(path.join(diagrams, 'flow.puml'), '@startuml\n@enduml');
		const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(0);
	});

	it('ignores .git directory', () => {
		const git = path.join(tmpDir, '.git');
		fs.mkdirSync(git);
		fs.writeFileSync(path.join(git, 'hook.puml'), '@startuml\n@enduml');
		const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(0);
	});

	it('does not find files for inactive providers', () => {
		fs.writeFileSync(path.join(tmpDir, 'flow.puml'), '@startuml\n@enduml');
		fs.writeFileSync(path.join(tmpDir, 'chart.mmd'), 'graph TD');
		const files = discoverFiles(tmpDir, makeConfig(['mermaid']));
		expect(files.every((f) => f.endsWith('.mmd'))).toBe(true);
	});

	it('returns empty array when no matching files', () => {
		fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# hi');
		const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(0);
	});

	it('finds files across multiple active providers', () => {
		fs.writeFileSync(path.join(tmpDir, 'flow.puml'), '@startuml\n@enduml');
		fs.writeFileSync(path.join(tmpDir, 'chart.mmd'), 'graph TD');
		fs.writeFileSync(path.join(tmpDir, 'arch.dot'), 'digraph {}');
		fs.writeFileSync(path.join(tmpDir, 'system.drawio'), '<mxfile/>');
		fs.writeFileSync(path.join(tmpDir, 'pipeline.d2'), 'x -> y');
		fs.writeFileSync(path.join(tmpDir, 'sketch.excalidraw'), '{}');
		fs.writeFileSync(path.join(tmpDir, 'process.bpmn'), '<definitions/>');
		const files = discoverFiles(tmpDir, makeConfig(['plantuml', 'mermaid', 'graphviz', 'drawio', 'd2', 'excalidraw', 'bpmn']));
		expect(files).toHaveLength(7);
	});
});

describe('discoverChangedFiles', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diagram-sync-changed-'));
		mockSpawnSync.mockReset();
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true });
	});

	it('returns diagram files reported as modified by git', () => {
		mockSpawnSync
			.mockReturnValueOnce({ stdout: 'flow.puml\n', stderr: '', status: 0 } as any)
			.mockReturnValueOnce({ stdout: '', stderr: '', status: 0 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(1);
		expect(files[0]).toBe(path.resolve(tmpDir, 'flow.puml'));
	});

	it('includes new untracked diagram files', () => {
		mockSpawnSync
			.mockReturnValueOnce({ stdout: '', stderr: '', status: 0 } as any)
			.mockReturnValueOnce({ stdout: 'new.mmd\n', stderr: '', status: 0 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['mermaid']));
		expect(files).toHaveLength(1);
		expect(files[0]).toBe(path.resolve(tmpDir, 'new.mmd'));
	});

	it('filters out non-diagram files', () => {
		mockSpawnSync
			.mockReturnValueOnce({ stdout: 'src/index.ts\nREADME.md\nflow.puml\n', stderr: '', status: 0 } as any)
			.mockReturnValueOnce({ stdout: '', stderr: '', status: 0 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(1);
		expect(files[0]).toMatch(/flow\.puml$/);
	});

	it('filters out diagram files for inactive providers', () => {
		mockSpawnSync
			.mockReturnValueOnce({ stdout: 'flow.puml\nchart.mmd\n', stderr: '', status: 0 } as any)
			.mockReturnValueOnce({ stdout: '', stderr: '', status: 0 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(1);
		expect(files.every((f) => f.endsWith('.puml'))).toBe(true);
	});

	it('resolves files to absolute paths', () => {
		mockSpawnSync
			.mockReturnValueOnce({ stdout: 'docs/system.puml\n', stderr: '', status: 0 } as any)
			.mockReturnValueOnce({ stdout: '', stderr: '', status: 0 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files[0]).toBe(path.resolve(tmpDir, 'docs/system.puml'));
	});

	it('returns empty array when no diagram files changed', () => {
		mockSpawnSync
			.mockReturnValueOnce({ stdout: 'README.md\nsrc/index.ts\n', stderr: '', status: 0 } as any)
			.mockReturnValueOnce({ stdout: '', stderr: '', status: 0 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(0);
	});

	it('returns empty array when git is not available', () => {
		mockSpawnSync.mockReturnValue({ error: new Error('git not found') } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(0);
	});

	it('returns empty array when git exits with non-zero status (not a git repo)', () => {
		mockSpawnSync.mockReturnValueOnce({ stdout: '', stderr: 'fatal: not a git repository', status: 128 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(0);
	});

	it('combines modified and untracked files', () => {
		mockSpawnSync
			.mockReturnValueOnce({ stdout: 'existing.puml\n', stderr: '', status: 0 } as any)
			.mockReturnValueOnce({ stdout: 'new.puml\n', stderr: '', status: 0 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(2);
	});

	it('ignores blank lines in git output', () => {
		mockSpawnSync
			.mockReturnValueOnce({ stdout: '\nflow.puml\n\n', stderr: '', status: 0 } as any)
			.mockReturnValueOnce({ stdout: '\n', stderr: '', status: 0 } as any);
		const files = discoverChangedFiles(tmpDir, makeConfig(['plantuml']));
		expect(files).toHaveLength(1);
	});
});
