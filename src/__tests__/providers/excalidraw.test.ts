import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnSync } from 'child_process';

vi.mock('child_process');

import { excalidrawProvider } from '../../providers/excalidraw';

const mockSpawnSync = vi.mocked(spawnSync);

beforeEach(() => {
  mockSpawnSync.mockReset();
});

describe('excalidrawProvider metadata', () => {
  it('has correct name', () => {
    expect(excalidrawProvider.name).toBe('excalidraw');
  });

  it('supports .excalidraw extension', () => {
    expect(excalidrawProvider.extensions).toContain('.excalidraw');
  });

  it('supports svg and png formats', () => {
    expect(excalidrawProvider.supportedFormats).toContain('svg');
    expect(excalidrawProvider.supportedFormats).toContain('png');
  });

  it('does not support pdf', () => {
    expect(excalidrawProvider.supportedFormats).not.toContain('pdf');
  });

  it('defaults to svg', () => {
    expect(excalidrawProvider.defaultFormat).toBe('svg');
  });
});

describe('excalidrawProvider.check', () => {
  it('returns available when excalidraw-brute-export-cli binary is found', () => {
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined } as any);
    expect(excalidrawProvider.check().available).toBe(true);
  });

  it('returns unavailable when excalidraw-brute-export-cli binary is not found', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = excalidrawProvider.check();
    expect(result.available).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('includes install hint referencing excalidraw-brute-export-cli and playwright firefox', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = excalidrawProvider.check();
    expect(result.message).toMatch(/excalidraw-brute-export-cli/i);
    expect(result.message).toMatch(/playwright/i);
    expect(result.message).toMatch(/firefox/i);
  });
});

describe('excalidrawProvider.generate', () => {
  it('calls excalidraw-brute-export-cli with -i, --format, -o flags for svg', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/diagram.excalidraw', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'excalidraw-brute-export-cli',
      ['-i', '/repo/diagram.excalidraw', '--format', 'svg', '-o', '/repo/diagrams/diagram.svg'],
      expect.any(Object),
    );
  });

  it('calls excalidraw-brute-export-cli with -i, --format, -o flags for png', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/diagram.excalidraw', '/repo/diagrams', 'png');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'excalidraw-brute-export-cli',
      ['-i', '/repo/diagram.excalidraw', '--format', 'png', '-o', '/repo/diagrams/diagram.png'],
      expect.any(Object),
    );
  });

  it('uses the source filename without its extension for the output filename', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/system.excalidraw', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'excalidraw-brute-export-cli',
      ['-i', '/repo/system.excalidraw', '--format', 'svg', '-o', '/repo/diagrams/system.svg'],
      expect.any(Object),
    );
  });

  it('throws on unsupported format', () => {
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'pdf')).toThrow(
      /does not support format/,
    );
  });

  it('throws with stderr when excalidraw-brute-export-cli exits non-zero', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', stdout: '', error: undefined } as any);
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'svg')).toThrow('render failed');
  });

  it('falls back to stdout when stderr is empty', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', stdout: 'Failed to load Excalidraw module.', error: undefined } as any);
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'svg')).toThrow('Failed to load Excalidraw module.');
  });

  it('throws with error message when spawn fails', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'svg')).toThrow('ENOENT');
  });

  it('throws with fallback message when no stderr, stdout or error', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', stdout: '', error: undefined } as any);
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'svg')).toThrow('excalidraw render failed');
  });

  it('input file is passed after -i flag', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/diagram.excalidraw', '/repo/diagrams', 'svg');
    const args = mockSpawnSync.mock.calls[1][1] as string[];
    expect(args[args.indexOf('-i') + 1]).toBe('/repo/diagram.excalidraw');
  });

  it('output file is passed after -o flag', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/diagram.excalidraw', '/repo/diagrams', 'svg');
    const args = mockSpawnSync.mock.calls[1][1] as string[];
    expect(args[args.indexOf('-o') + 1]).toBe('/repo/diagrams/diagram.svg');
  });
});
