import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnSync } from 'child_process';

vi.mock('child_process');

import { graphvizProvider } from '../../providers/graphviz';

const mockSpawnSync = vi.mocked(spawnSync);

beforeEach(() => {
  mockSpawnSync.mockReset();
});

describe('graphvizProvider metadata', () => {
  it('has correct name', () => {
    expect(graphvizProvider.name).toBe('graphviz');
  });

  it('supports .dot and .gv extensions', () => {
    expect(graphvizProvider.extensions).toContain('.dot');
    expect(graphvizProvider.extensions).toContain('.gv');
  });

  it('supports png, svg, eps, pdf formats', () => {
    expect(graphvizProvider.supportedFormats).toEqual(expect.arrayContaining(['png', 'svg', 'eps', 'pdf']));
  });

  it('defaults to svg', () => {
    expect(graphvizProvider.defaultFormat).toBe('svg');
  });
});

describe('graphvizProvider.check', () => {
  it('returns available when dot exits successfully', () => {
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined } as any);
    expect(graphvizProvider.check().available).toBe(true);
  });

  it('returns unavailable when dot binary is not found', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = graphvizProvider.check();
    expect(result.available).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('includes install hint in unavailable message', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = graphvizProvider.check();
    expect(result.message).toMatch(/graphviz/i);
  });
});

describe('graphvizProvider.generate', () => {
  it('calls dot with correct args for svg', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    graphvizProvider.generate('/repo/arch.dot', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'dot',
      ['-Tsvg', '/repo/arch.dot', '-o', '/repo/diagrams/arch.svg'],
      expect.any(Object),
    );
  });

  it('calls dot with correct args for png', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    graphvizProvider.generate('/repo/arch.dot', '/repo/diagrams', 'png');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'dot',
      ['-Tpng', '/repo/arch.dot', '-o', '/repo/diagrams/arch.png'],
      expect.any(Object),
    );
  });

  it('uses the source filename without its extension for the output filename', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    graphvizProvider.generate('/repo/system.gv', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'dot',
      ['-Tsvg', '/repo/system.gv', '-o', '/repo/diagrams/system.svg'],
      expect.any(Object),
    );
  });

  it('throws on unsupported format', () => {
    expect(() => graphvizProvider.generate('/repo/arch.dot', '/out', 'gif')).toThrow(
      /does not support format/,
    );
  });

  it('throws with stderr when dot exits non-zero', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', error: undefined } as any);
    expect(() => graphvizProvider.generate('/repo/arch.dot', '/out', 'svg')).toThrow('render failed');
  });

  it('throws with error message when spawn fails', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    expect(() => graphvizProvider.generate('/repo/arch.dot', '/out', 'svg')).toThrow('ENOENT');
  });

  it('throws with fallback message when no stderr or error', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', error: undefined } as any);
    expect(() => graphvizProvider.generate('/repo/arch.dot', '/out', 'svg')).toThrow('graphviz render failed');
  });
});
