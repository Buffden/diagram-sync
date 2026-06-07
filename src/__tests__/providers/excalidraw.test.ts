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

  it('only supports png format', () => {
    expect(excalidrawProvider.supportedFormats).toEqual(['png']);
  });

  it('does not support svg or pdf', () => {
    expect(excalidrawProvider.supportedFormats).not.toContain('svg');
    expect(excalidrawProvider.supportedFormats).not.toContain('pdf');
  });

  it('defaults to png', () => {
    expect(excalidrawProvider.defaultFormat).toBe('png');
  });
});

describe('excalidrawProvider.check', () => {
  it('returns available when excalidraw-export binary is found', () => {
    mockSpawnSync.mockReturnValue({ status: 1, error: undefined } as any);
    expect(excalidrawProvider.check().available).toBe(true);
  });

  it('returns unavailable when excalidraw-export binary is not found', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = excalidrawProvider.check();
    expect(result.available).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('includes install hint referencing excalidraw-export-cli and playwright', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = excalidrawProvider.check();
    expect(result.message).toMatch(/excalidraw-export-cli/i);
    expect(result.message).toMatch(/playwright/i);
  });
});

describe('excalidrawProvider.generate', () => {
  it('calls excalidraw-export with input and output file', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/diagram.excalidraw', '/repo/diagrams', 'png');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'excalidraw-export',
      ['/repo/diagram.excalidraw', '/repo/diagrams/diagram.png'],
      expect.any(Object),
    );
  });

  it('uses the source filename without its extension for the output filename', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/system.excalidraw', '/repo/diagrams', 'png');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'excalidraw-export',
      ['/repo/system.excalidraw', '/repo/diagrams/system.png'],
      expect.any(Object),
    );
  });

  it('throws on unsupported format', () => {
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'svg')).toThrow(
      /does not support format/,
    );
  });

  it('throws with stderr when excalidraw-export exits non-zero', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', stdout: '', error: undefined } as any);
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'png')).toThrow('render failed');
  });

  it('falls back to stdout when stderr is empty', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', stdout: 'Failed to load Excalidraw module.', error: undefined } as any);
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'png')).toThrow('Failed to load Excalidraw module.');
  });

  it('throws with error message when spawn fails', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'png')).toThrow('ENOENT');
  });

  it('throws with fallback message when no stderr, stdout or error', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', stdout: '', error: undefined } as any);
    expect(() => excalidrawProvider.generate('/repo/diagram.excalidraw', '/out', 'png')).toThrow('excalidraw render failed');
  });

  it('input file is the first argument', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/diagram.excalidraw', '/repo/diagrams', 'png');
    const args = mockSpawnSync.mock.calls[1][1] as string[];
    expect(args[0]).toBe('/repo/diagram.excalidraw');
  });

  it('output file is the last argument', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    excalidrawProvider.generate('/repo/diagram.excalidraw', '/repo/diagrams', 'png');
    const args = mockSpawnSync.mock.calls[1][1] as string[];
    expect(args[args.length - 1]).toBe('/repo/diagrams/diagram.png');
  });
});
