import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';

vi.mock('child_process');
vi.mock('fs');

import { mermaidProvider } from '../../providers/mermaid';

const mockSpawnSync = vi.mocked(spawnSync);

beforeEach(() => {
	mockSpawnSync.mockReset();
	delete process.env.CI;
});

afterEach(() => {
	delete process.env.CI;
});

describe('mermaidProvider metadata', () => {
	it('has correct name', () => {
		expect(mermaidProvider.name).toBe('mermaid');
	});

	it('supports .mmd and .mermaid extensions', () => {
		expect(mermaidProvider.extensions).toContain('.mmd');
		expect(mermaidProvider.extensions).toContain('.mermaid');
	});

	it('supports png, svg, pdf formats', () => {
		expect(mermaidProvider.supportedFormats).toEqual(expect.arrayContaining(['png', 'svg', 'pdf']));
	});

	it('defaults to svg', () => {
		expect(mermaidProvider.defaultFormat).toBe('svg');
	});
});

describe('mermaidProvider.check', () => {
	it('returns available when mmdc exits with status 0', () => {
		mockSpawnSync.mockReturnValue({ status: 0, error: undefined } as any);
		expect(mermaidProvider.check().available).toBe(true);
	});

	it('returns unavailable when mmdc is not found', () => {
		mockSpawnSync.mockReturnValue({ status: 1, error: new Error('not found') } as any);
		const result = mermaidProvider.check();
		expect(result.available).toBe(false);
		expect(result.message).toBeDefined();
	});

	it('includes install hint in unavailable message', () => {
		mockSpawnSync.mockReturnValue({ status: 1, error: new Error('not found') } as any);
		const result = mermaidProvider.check();
		expect(result.message).toMatch(/mmdc|mermaid/i);
	});
});

describe('mermaidProvider.generate', () => {
	it('calls mmdc with correct output path for png', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		mermaidProvider.generate('/repo/flow.mmd', '/repo/diagrams', 'png');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'mmdc',
			['-i', '/repo/flow.mmd', '-o', '/repo/diagrams/flow.png'],
			expect.any(Object),
		);
	});

	it('calls mmdc with correct output path for svg', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		mermaidProvider.generate('/repo/flow.mmd', '/repo/diagrams', 'svg');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'mmdc',
			['-i', '/repo/flow.mmd', '-o', '/repo/diagrams/flow.svg'],
			expect.any(Object),
		);
	});

	it('calls mmdc with correct output path for pdf', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		mermaidProvider.generate('/repo/flow.mmd', '/repo/diagrams', 'pdf');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'mmdc',
			['-i', '/repo/flow.mmd', '-o', '/repo/diagrams/flow.pdf'],
			expect.any(Object),
		);
	});

	it('uses the source filename without its extension for the output filename', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		mermaidProvider.generate('/repo/auth-flow.mermaid', '/repo/diagrams', 'png');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'mmdc',
			['-i', '/repo/auth-flow.mermaid', '-o', '/repo/diagrams/auth-flow.png'],
			expect.any(Object),
		);
	});

	it('throws on unsupported format', () => {
		expect(() => mermaidProvider.generate('/repo/flow.mmd', '/out', 'gif')).toThrow(
			/does not support format/,
		);
	});

	it('throws with stderr when mmdc exits non-zero', () => {
		mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', error: undefined } as any);
		expect(() => mermaidProvider.generate('/repo/flow.mmd', '/out', 'png')).toThrow('render failed');
	});

	it('throws with error message when spawn fails', () => {
		mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
		expect(() => mermaidProvider.generate('/repo/flow.mmd', '/out', 'png')).toThrow('ENOENT');
	});

	it('passes --no-sandbox puppeteer config when CI env is set', () => {
		process.env.CI = 'true';
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		mermaidProvider.generate('/repo/flow.mmd', '/repo/diagrams', 'png');
		const args = mockSpawnSync.mock.calls[0][1] as string[];
		expect(args).toContain('-p');
	});

	it('does not pass puppeteer config when CI env is not set', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		mermaidProvider.generate('/repo/flow.mmd', '/repo/diagrams', 'png');
		const args = mockSpawnSync.mock.calls[0][1] as string[];
		expect(args).not.toContain('-p');
	});
});
