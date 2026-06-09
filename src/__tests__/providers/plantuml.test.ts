import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnSync } from 'child_process';

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

describe('plantumlProvider.generate', () => {
	it('calls plantuml with -tpng flag for png', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		plantumlProvider.generate('/repo/flow.puml', '/repo/diagrams', 'png');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'plantuml',
			['-tpng', '-o', '/repo/diagrams', '/repo/flow.puml'],
			expect.any(Object),
		);
	});

	it('calls plantuml with -tsvg flag for svg', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		plantumlProvider.generate('/repo/flow.puml', '/repo/diagrams', 'svg');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'plantuml',
			['-tsvg', '-o', '/repo/diagrams', '/repo/flow.puml'],
			expect.any(Object),
		);
	});

	it('calls plantuml with -teps flag for eps', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		plantumlProvider.generate('/repo/flow.puml', '/repo/diagrams', 'eps');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'plantuml',
			['-teps', '-o', '/repo/diagrams', '/repo/flow.puml'],
			expect.any(Object),
		);
	});

	it('calls plantuml with -tpdf flag for pdf', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		plantumlProvider.generate('/repo/flow.puml', '/repo/diagrams', 'pdf');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'plantuml',
			['-tpdf', '-o', '/repo/diagrams', '/repo/flow.puml'],
			expect.any(Object),
		);
	});

	it('throws on unsupported format', () => {
		expect(() => plantumlProvider.generate('/repo/flow.puml', '/out', 'gif')).toThrow(
			/does not support format/,
		);
	});

	it('throws with stderr when plantuml exits non-zero', () => {
		mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', error: undefined } as any);
		expect(() => plantumlProvider.generate('/repo/flow.puml', '/out', 'png')).toThrow('render failed');
	});

	it('throws with error message when spawn fails', () => {
		mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
		expect(() => plantumlProvider.generate('/repo/flow.puml', '/out', 'png')).toThrow('ENOENT');
	});
});
