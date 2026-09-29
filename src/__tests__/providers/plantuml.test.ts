import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

vi.mock('child_process');

import { plantumlProvider } from '../../providers/plantuml';

const mockSpawnSync = vi.mocked(spawnSync);

beforeEach(() => {
	mockSpawnSync.mockReset();
});

describe('plantumlProvider metadata', () => {
	it('has correct name', () => {
		expect(plantumlProvider.name).toBe('plantuml');
	});

	it('supports .puml and .plantuml extensions', () => {
		expect(plantumlProvider.extensions).toContain('.puml');
		expect(plantumlProvider.extensions).toContain('.plantuml');
	});

	it('supports png, svg, eps, pdf formats', () => {
		expect(plantumlProvider.supportedFormats).toEqual(expect.arrayContaining(['png', 'svg', 'eps', 'pdf']));
	});

	it('defaults to svg', () => {
		expect(plantumlProvider.defaultFormat).toBe('svg');
	});
});

describe('plantumlProvider.check', () => {
	it('returns available when plantuml exits with status 0', () => {
		mockSpawnSync.mockReturnValue({ status: 0, error: undefined } as any);
		expect(plantumlProvider.check().available).toBe(true);
	});

	it('returns available when plantuml exits non-zero but binary exists (e.g. Graphviz missing)', () => {
		mockSpawnSync.mockReturnValue({ status: 250, error: undefined } as any);
		expect(plantumlProvider.check().available).toBe(true);
	});

	it('returns unavailable when plantuml binary is not found', () => {
		mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
		const result = plantumlProvider.check();
		expect(result.available).toBe(false);
		expect(result.message).toBeDefined();
	});

	it('includes install hint in unavailable message', () => {
		mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
		const result = plantumlProvider.check();
		expect(result.message).toMatch(/plantuml/i);
	});
});

// Simulates plantuml writing the given file names into its -o folder
function renders(...names: string[]) {
	mockSpawnSync.mockImplementation(((_cmd: string, args: string[]) => {
		const dir = args[args.indexOf('-o') + 1];
		for (const name of names) fs.writeFileSync(path.join(dir, name), 'out');
		return { status: 0 };
	}) as any);
}

describe('plantumlProvider.generate', () => {
	let outDir: string;

	beforeEach(() => {
		outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diagram-sync-puml-test-'));
	});

	afterEach(() => {
		fs.rmSync(outDir, { recursive: true, force: true });
	});

	it.each([
		['png', '-tpng'],
		['svg', '-tsvg'],
		['eps', '-teps'],
		['pdf', '-tpdf'],
	])('calls plantuml with the %s flag and default white background', (format, flag) => {
		renders(`flow.${format}`);
		plantumlProvider.generate('/repo/flow.puml', outDir, format);
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'plantuml',
			[flag, '--skinparam', 'backgroundColor=#FFFFFF', '-o', expect.any(String), '/repo/flow.puml'],
			expect.any(Object),
		);
	});

	it('renders into a temp folder and cleans it up', () => {
		renders('flow.svg');
		plantumlProvider.generate('/repo/flow.puml', outDir, 'svg');
		const args = mockSpawnSync.mock.calls[0][1] as string[];
		const scratch = args[args.indexOf('-o') + 1];
		expect(scratch).not.toBe(outDir);
		expect(fs.existsSync(scratch)).toBe(false);
	});

	it('uses a custom background color from options', () => {
		renders('flow.svg');
		plantumlProvider.generate('/repo/flow.puml', outDir, 'svg', { background: '#123456' });
		expect(mockSpawnSync.mock.calls[0][1]).toContain('backgroundColor=#123456');
	});

	it('passes transparent background when configured', () => {
		renders('flow.svg');
		plantumlProvider.generate('/repo/flow.puml', outDir, 'svg', { background: 'transparent' });
		expect(mockSpawnSync.mock.calls[0][1]).toContain('backgroundColor=transparent');
	});

	it('names the output after the source file, not the @startuml title', () => {
		renders('Order Flow.png');
		const written = plantumlProvider.generate('/repo/docs/order flow.puml', outDir, 'png');
		expect(written).toEqual([path.join(outDir, 'order flow.png')]);
		expect(fs.readdirSync(outDir)).toEqual(['order flow.png']);
	});

	it('keeps plantuml names when a file contains several diagrams', () => {
		renders('flow.svg', 'flow_001.svg');
		const written = plantumlProvider.generate('/repo/flow.puml', outDir, 'svg');
		expect(written).toEqual([path.join(outDir, 'flow.svg'), path.join(outDir, 'flow_001.svg')]);
	});

	it('throws when plantuml writes no output', () => {
		renders();
		expect(() => plantumlProvider.generate('/repo/flow.puml', outDir, 'svg')).toThrow(/no \.svg output/);
	});

	it('throws on unsupported format', () => {
		expect(() => plantumlProvider.generate('/repo/flow.puml', '/out', 'gif')).toThrow(
			/does not support format/,
		);
	});

	it('throws with stderr when plantuml exits non-zero', () => {
		mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', error: undefined } as any);
		expect(() => plantumlProvider.generate('/repo/flow.puml', outDir, 'png')).toThrow('render failed');
	});

	it('throws with error message when spawn fails', () => {
		mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
		expect(() => plantumlProvider.generate('/repo/flow.puml', outDir, 'png')).toThrow('ENOENT');
	});
});
