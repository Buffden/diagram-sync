import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnSync } from 'child_process';

vi.mock('child_process');

import { d2Provider } from '../../providers/d2';

const mockSpawnSync = vi.mocked(spawnSync);

beforeEach(() => {
  mockSpawnSync.mockReset();
});

describe('d2Provider metadata', () => {
  it('has correct name', () => {
    expect(d2Provider.name).toBe('d2');
  });

  it('supports .d2 extension', () => {
    expect(d2Provider.extensions).toContain('.d2');
  });

  it('supports svg and png formats', () => {
    expect(d2Provider.supportedFormats).toEqual(expect.arrayContaining(['svg', 'png']));
  });

  it('does not support pdf or gif', () => {
    expect(d2Provider.supportedFormats).not.toContain('pdf');
    expect(d2Provider.supportedFormats).not.toContain('gif');
  });

  it('defaults to svg', () => {
    expect(d2Provider.defaultFormat).toBe('svg');
  });
});

describe('d2Provider.check', () => {
  it('returns available when d2 exits successfully', () => {
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined } as any);
    expect(d2Provider.check().available).toBe(true);
  });

  it('returns unavailable when d2 binary is not found', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = d2Provider.check();
    expect(result.available).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('includes install hint in unavailable message', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = d2Provider.check();
    expect(result.message).toMatch(/d2/i);
  });
});

describe('d2Provider.generate', () => {
  it('calls d2 with input and output file for svg', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    d2Provider.generate('/repo/arch.d2', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'd2',
      ['/repo/arch.d2', '/repo/diagrams/arch.svg'],
      expect.any(Object),
    );
  });

  it('calls d2 with input and output file for png', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    d2Provider.generate('/repo/arch.d2', '/repo/diagrams', 'png');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'd2',
      ['/repo/arch.d2', '/repo/diagrams/arch.png'],
      expect.any(Object),
    );
  });

  it('uses the source filename without its extension for the output filename', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    d2Provider.generate('/repo/system.d2', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'd2',
      ['/repo/system.d2', '/repo/diagrams/system.svg'],
      expect.any(Object),
    );
  });

  it('throws on unsupported format', () => {
    expect(() => d2Provider.generate('/repo/arch.d2', '/out', 'pdf')).toThrow(
      /does not support format/,
    );
  });

  it('throws with stderr when d2 exits non-zero', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', error: undefined } as any);
    expect(() => d2Provider.generate('/repo/arch.d2', '/out', 'svg')).toThrow('render failed');
  });

  it('throws with error message when spawn fails', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    expect(() => d2Provider.generate('/repo/arch.d2', '/out', 'svg')).toThrow('ENOENT');
  });

  it('throws with fallback message when no stderr or error', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', error: undefined } as any);
    expect(() => d2Provider.generate('/repo/arch.d2', '/out', 'svg')).toThrow('d2 render failed');
  });

  it('input file is always the first argument', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    d2Provider.generate('/repo/arch.d2', '/repo/diagrams', 'svg');
    const args = mockSpawnSync.mock.calls[0][1] as string[];
    expect(args[0]).toBe('/repo/arch.d2');
  });

  it('output file is always the last argument', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    d2Provider.generate('/repo/arch.d2', '/repo/diagrams', 'svg');
    const args = mockSpawnSync.mock.calls[0][1] as string[];
    expect(args[args.length - 1]).toBe('/repo/diagrams/arch.svg');
  });
});
