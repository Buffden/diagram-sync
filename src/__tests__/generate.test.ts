import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { type DiagramProvider } from '../providers/types';

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

vi.mock('../logger', () => ({
	log: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
	},
}));

vi.mock('../providers', () => ({
	getProvider: vi.fn(),
	allExtensions: vi.fn(() => ['.puml', '.mmd', '.dot', '.gv']),
	allProviderNames: vi.fn(() => ['plantuml', 'mermaid', 'graphviz']),
}));

import { getProvider } from '../providers';
import { log } from '../logger';
import { generateDiagrams } from '../generate';

const mockGetProvider = vi.mocked(getProvider);
const mockLog = vi.mocked(log);

function makeMockProvider(overrides: Partial<DiagramProvider> = {}): DiagramProvider {
	return {
		name: 'mock',
		extensions: ['.mock'],
		supportedFormats: ['png', 'svg'],
		defaultFormat: 'png',
		check: vi.fn(() => ({ available: true })),
		generate: vi.fn(),
		...overrides,
	};
}

describe('generateDiagrams', () => {
	const root = '/repo';
	const config = { jobs: [{ name: 'mock', type: 'mock' }] };

	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
	});

	it('warns and returns early when no files provided', () => {
		generateDiagrams([], root, config);
		expect(mockLog.warn).toHaveBeenCalledWith(expect.stringMatching(/no diagram source files/i));
	});

	it('warns when no provider is registered for a file extension', () => {
		mockGetProvider.mockReturnValue(undefined);
		generateDiagrams(['/repo/file.unknown'], root, config);
		expect(mockLog.warn).toHaveBeenCalledWith(expect.stringMatching(/no provider registered/i));
	});

	it('generates a file with the resolved format', () => {
		const provider = makeMockProvider({ name: 'mock' });
		mockGetProvider.mockReturnValue(provider);
		generateDiagrams(['/repo/flow.mock'], root, config);
		expect(provider.generate).toHaveBeenCalledWith('/repo/flow.mock', expect.any(String), 'svg');
	});

	it('uses cli format when provided', () => {
		const provider = makeMockProvider({ name: 'mock' });
		mockGetProvider.mockReturnValue(provider);
		generateDiagrams(['/repo/flow.mock'], root, config, 'svg');
		expect(provider.generate).toHaveBeenCalledWith('/repo/flow.mock', expect.any(String), 'svg');
	});

	it('uses job format over global format', () => {
		const provider = makeMockProvider({ name: 'mock' });
		mockGetProvider.mockReturnValue(provider);
		const cfg = { format: 'svg', jobs: [{ name: 'mock', type: 'mock', format: 'png' }] };
		generateDiagrams(['/repo/flow.mock'], root, cfg);
		expect(provider.generate).toHaveBeenCalledWith('/repo/flow.mock', expect.any(String), 'png');
	});

	it('errors when explicit format is unsupported by provider', () => {
		const provider = makeMockProvider({ name: 'mock', supportedFormats: ['png', 'svg'] });
		mockGetProvider.mockReturnValue(provider);
		generateDiagrams(['/repo/flow.mock'], root, config, 'eps');
		expect(provider.generate).not.toHaveBeenCalled();
		expect(mockLog.error).toHaveBeenCalled();
	});

	it('warns and falls back to provider default when system default is unsupported', () => {
		const provider = makeMockProvider({
			name: 'mock',
			supportedFormats: ['png'],
			defaultFormat: 'png',
		});
		mockGetProvider.mockReturnValue(provider);
		// no explicit format — system default 'svg' is unsupported by this provider
		generateDiagrams(['/repo/flow.mock'], root, config);
		expect(mockLog.warn).toHaveBeenCalledWith(expect.stringMatching(/does not support/i));
		expect(provider.generate).toHaveBeenCalledWith('/repo/flow.mock', expect.any(String), 'png');
	});

	it('counts failed files when provider is unavailable', () => {
		const provider = makeMockProvider({
			check: vi.fn(() => ({ available: false, message: 'not found' })),
		});
		mockGetProvider.mockReturnValue(provider);
		generateDiagrams(['/repo/flow.mock'], root, config);
		expect(provider.generate).not.toHaveBeenCalled();
	});

	it('counts failed files when generate throws', () => {
		const provider = makeMockProvider({
			generate: vi.fn(() => { throw new Error('render error'); }),
		});
		mockGetProvider.mockReturnValue(provider);
		generateDiagrams(['/repo/flow.mock'], root, config);
		expect(mockLog.error).toHaveBeenCalled();
	});

	it('logs success after generation', () => {
		const provider = makeMockProvider();
		mockGetProvider.mockReturnValue(provider);
		generateDiagrams(['/repo/flow.mock'], root, config);
		expect(mockLog.success).toHaveBeenCalled();
	});

	it('only calls check() once per provider when processing multiple files in a single call', () => {
		const provider = makeMockProvider();
		mockGetProvider.mockReturnValue(provider);
		generateDiagrams(['/repo/a.mock', '/repo/b.mock', '/repo/c.mock'], root, config);
		expect(provider.check).toHaveBeenCalledTimes(1);
	});

	it('does not carry provider availability state between separate generateDiagrams calls', () => {
		const provider = makeMockProvider({
			check: vi.fn()
				.mockReturnValueOnce({ available: false, message: 'not found' })
				.mockReturnValueOnce({ available: true }),
		});
		mockGetProvider.mockReturnValue(provider);

		// first call: provider unavailable — generate should not be called
		generateDiagrams(['/repo/flow.mock'], root, config);
		expect(provider.generate).not.toHaveBeenCalled();

		// second call: provider now available — generate should be called
		generateDiagrams(['/repo/flow.mock'], root, config);
		expect(provider.generate).toHaveBeenCalledTimes(1);
	});

	it('skips check() for unavailable provider on subsequent files in same call', () => {
		const provider = makeMockProvider({
			check: vi.fn(() => ({ available: false, message: 'not found' })),
		});
		mockGetProvider.mockReturnValue(provider);
		generateDiagrams(['/repo/a.mock', '/repo/b.mock'], root, config);
		// check is cached — should only be called once despite two files
		expect(provider.check).toHaveBeenCalledTimes(1);
		expect(provider.generate).not.toHaveBeenCalled();
	});
});
