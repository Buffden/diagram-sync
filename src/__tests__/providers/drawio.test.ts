import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';

vi.mock('child_process');

import { drawioProvider } from '../../providers/drawio';

const mockSpawnSync = vi.mocked(spawnSync);

beforeEach(() => {
	mockSpawnSync.mockReset();
	delete process.env.CI;
	process.env.DISPLAY = ':0';
});

afterEach(() => {
	delete process.env.CI;
	delete process.env.DISPLAY;
	vi.restoreAllMocks();
});

describe('drawioProvider metadata', () => {
	it('has correct name', () => {
		expect(drawioProvider.name).toBe('drawio');
	});

	it('supports .drawio and .dio extensions', () => {
		expect(drawioProvider.extensions).toContain('.drawio');
		expect(drawioProvider.extensions).toContain('.dio');
	});

	it('supports svg, png, jpg, jpeg, pdf formats', () => {
		expect(drawioProvider.supportedFormats).toEqual(
			expect.arrayContaining(['svg', 'png', 'jpg', 'jpeg', 'pdf']),
		);
	});

	it('does not support eps or gif', () => {
		expect(drawioProvider.supportedFormats).not.toContain('eps');
		expect(drawioProvider.supportedFormats).not.toContain('gif');
	});

	it('defaults to svg', () => {
		expect(drawioProvider.defaultFormat).toBe('svg');
	});
});

describe('drawioProvider.check', () => {
	it('returns available when drawio exits successfully', () => {
		mockSpawnSync.mockReturnValue({ status: 0, error: undefined } as any);
		expect(drawioProvider.check().available).toBe(true);
	});

	it('returns unavailable when drawio binary is not found', () => {
		mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
		const result = drawioProvider.check();
		expect(result.available).toBe(false);
		expect(result.message).toBeDefined();
	});

	it('includes install hint in unavailable message', () => {
		mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
		const result = drawioProvider.check();
		expect(result.message).toMatch(/drawio/i);
	});

	it('returns available even when exit status is non-zero', () => {
		mockSpawnSync.mockReturnValue({ status: 1, error: undefined } as any);
		expect(drawioProvider.check().available).toBe(true);
	});

	it('returns unavailable on Linux with no display when xvfb-run is not found', () => {
		delete process.env.DISPLAY;
		vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
		mockSpawnSync
			.mockReturnValueOnce({ status: 0, error: undefined } as any)  // drawio --version
			.mockReturnValueOnce({ status: 1, error: undefined } as any); // which xvfb-run
		const result = drawioProvider.check();
		expect(result.available).toBe(false);
		expect(result.message).toMatch(/xvfb/i);
	});

	it('returns available on Linux with no display when xvfb-run is found', () => {
		delete process.env.DISPLAY;
		vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
		mockSpawnSync
			.mockReturnValueOnce({ status: 0, error: undefined } as any)  // drawio --version
			.mockReturnValueOnce({ status: 0, error: undefined } as any); // which xvfb-run
		expect(drawioProvider.check().available).toBe(true);
	});

	it('skips xvfb-run check on Linux when display is available', () => {
		vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
		mockSpawnSync.mockReturnValue({ status: 0, error: undefined } as any);
		expect(drawioProvider.check().available).toBe(true);
		expect(mockSpawnSync).toHaveBeenCalledTimes(1); // only drawio --version
	});
});

describe('drawioProvider.generate', () => {
	it('calls drawio with correct args for svg', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'svg');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'drawio',
			['--no-sandbox', '--disable-gpu', '--export', '--format', 'svg', '--output', '/repo/diagrams/arch.svg', '/repo/arch.drawio'],
			expect.any(Object),
		);
	});

	it('calls drawio with correct args for png', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'png');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'drawio',
			['--no-sandbox', '--disable-gpu', '--export', '--format', 'png', '--output', '/repo/diagrams/arch.png', '/repo/arch.drawio'],
			expect.any(Object),
		);
	});

	it('calls drawio with correct args for jpg', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'jpg');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'drawio',
			['--no-sandbox', '--disable-gpu', '--export', '--format', 'jpg', '--output', '/repo/diagrams/arch.jpg', '/repo/arch.drawio'],
			expect.any(Object),
		);
	});

	it('calls drawio with correct args for pdf', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'pdf');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'drawio',
			['--no-sandbox', '--disable-gpu', '--export', '--format', 'pdf', '--output', '/repo/diagrams/arch.pdf', '/repo/arch.drawio'],
			expect.any(Object),
		);
	});

	it('uses the source filename without its extension for the output filename', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/system.dio', '/repo/diagrams', 'svg');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'drawio',
			['--no-sandbox', '--disable-gpu', '--export', '--format', 'svg', '--output', '/repo/diagrams/system.svg', '/repo/system.dio'],
			expect.any(Object),
		);
	});

	it('throws on unsupported format', () => {
		expect(() => drawioProvider.generate('/repo/arch.drawio', '/out', 'webp')).toThrow(
			/does not support format/,
		);
	});

	it('throws with stderr when drawio exits non-zero', () => {
		mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', error: undefined } as any);
		expect(() => drawioProvider.generate('/repo/arch.drawio', '/out', 'svg')).toThrow('render failed');
	});

	it('throws with error message when spawn fails', () => {
		mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
		expect(() => drawioProvider.generate('/repo/arch.drawio', '/out', 'svg')).toThrow('ENOENT');
	});

	it('throws with fallback message when no stderr or error', () => {
		mockSpawnSync.mockReturnValue({ status: 1, stderr: '', error: undefined } as any);
		expect(() => drawioProvider.generate('/repo/arch.drawio', '/out', 'svg')).toThrow('drawio render failed');
	});

	it('always puts --no-sandbox and --disable-gpu before --export', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'svg');
		const args = mockSpawnSync.mock.calls[0][1] as string[];
		expect(args[0]).toBe('--no-sandbox');
		expect(args[1]).toBe('--disable-gpu');
		expect(args.indexOf('--export')).toBeGreaterThan(args.indexOf('--disable-gpu'));
	});

	it('input file is always the last argument', () => {
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'svg');
		const args = mockSpawnSync.mock.calls[0][1] as string[];
		expect(args[args.length - 1]).toBe('/repo/arch.drawio');
	});

	it('uses xvfb-run on Linux when no display is available', () => {
		delete process.env.DISPLAY;
		vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'svg');
		expect(mockSpawnSync).toHaveBeenCalledWith(
			'xvfb-run',
			['-a', 'drawio', '--no-sandbox', '--disable-gpu', '--export', '--format', 'svg', '--output', '/repo/diagrams/arch.svg', '/repo/arch.drawio'],
			expect.any(Object),
		);
	});

	it('uses drawio directly when display is available on Linux', () => {
		vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'svg');
		const cmd = mockSpawnSync.mock.calls[0][0] as string;
		expect(cmd).toBe('drawio');
	});

	it('input file is last argument when using xvfb-run', () => {
		delete process.env.DISPLAY;
		vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
		mockSpawnSync.mockReturnValue({ status: 0 } as any);
		drawioProvider.generate('/repo/arch.drawio', '/repo/diagrams', 'svg');
		const args = mockSpawnSync.mock.calls[0][1] as string[];
		expect(args[args.length - 1]).toBe('/repo/arch.drawio');
	});
});
