import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnSync } from 'child_process';

vi.mock('child_process');

import { erdProvider } from '../../providers/erd';

const mockSpawnSync = vi.mocked(spawnSync);

beforeEach(() => {
  mockSpawnSync.mockReset();
});

describe('erdProvider metadata', () => {
  it('has correct name', () => {
    expect(erdProvider.name).toBe('erd');
  });

  it('supports .er extension', () => {
    expect(erdProvider.extensions).toContain('.er');
  });

  it('supports svg, png, and pdf formats', () => {
    expect(erdProvider.supportedFormats).toEqual(expect.arrayContaining(['svg', 'png', 'pdf']));
  });

  it('defaults to svg', () => {
    expect(erdProvider.defaultFormat).toBe('svg');
  });
});

describe('erdProvider.check', () => {
  it('returns available when erd binary is found', () => {
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined } as any);
    expect(erdProvider.check().available).toBe(true);
  });

  it('returns unavailable when erd binary is not found', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = erdProvider.check();
    expect(result.available).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('includes brew install hint in unavailable message', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = erdProvider.check();
    expect(result.message).toMatch(/brew install erd/i);
  });

  it('includes GitHub link in unavailable message', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = erdProvider.check();
    expect(result.message).toMatch(/BurntSushi\/erd/i);
  });
});

describe('erdProvider.generate', () => {
  it('calls erd with -i and -o flags for svg', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    erdProvider.generate('/repo/schema.er', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'erd',
      ['-i', '/repo/schema.er', '-o', '/repo/diagrams/schema.svg'],
      expect.any(Object),
    );
  });

  it('calls erd with -i and -o flags for png', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    erdProvider.generate('/repo/schema.er', '/repo/diagrams', 'png');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'erd',
      ['-i', '/repo/schema.er', '-o', '/repo/diagrams/schema.png'],
      expect.any(Object),
    );
  });

  it('uses the source filename without its extension for the output filename', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    erdProvider.generate('/repo/blog-schema.er', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'erd',
      ['-i', '/repo/blog-schema.er', '-o', '/repo/diagrams/blog-schema.svg'],
      expect.any(Object),
    );
  });

  it('throws on unsupported format', () => {
    expect(() => erdProvider.generate('/repo/schema.er', '/out', 'gif')).toThrow(
      /does not support format/,
    );
  });

  it('throws with stderr when erd exits non-zero', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: 'parse error', error: undefined } as any);
    expect(() => erdProvider.generate('/repo/schema.er', '/out', 'svg')).toThrow('parse error');
  });

  it('throws with error message when spawn fails', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    expect(() => erdProvider.generate('/repo/schema.er', '/out', 'svg')).toThrow('ENOENT');
  });

  it('throws with fallback message when no stderr or error', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', error: undefined } as any);
    expect(() => erdProvider.generate('/repo/schema.er', '/out', 'svg')).toThrow('erd render failed');
  });

  it('input file follows -i flag', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    erdProvider.generate('/repo/schema.er', '/repo/diagrams', 'svg');
    const args = mockSpawnSync.mock.calls[0][1] as string[];
    expect(args[args.indexOf('-i') + 1]).toBe('/repo/schema.er');
  });

  it('output file follows -o flag', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    erdProvider.generate('/repo/schema.er', '/repo/diagrams', 'svg');
    const args = mockSpawnSync.mock.calls[0][1] as string[];
    expect(args[args.indexOf('-o') + 1]).toBe('/repo/diagrams/schema.svg');
  });
});
