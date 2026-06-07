import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnSync } from 'child_process';

vi.mock('child_process');

import { bpmnProvider } from '../../providers/bpmn';

const mockSpawnSync = vi.mocked(spawnSync);

beforeEach(() => {
  mockSpawnSync.mockReset();
});

describe('bpmnProvider metadata', () => {
  it('has correct name', () => {
    expect(bpmnProvider.name).toBe('bpmn');
  });

  it('supports .bpmn extension', () => {
    expect(bpmnProvider.extensions).toContain('.bpmn');
  });

  it('supports svg, png and pdf formats', () => {
    expect(bpmnProvider.supportedFormats).toEqual(expect.arrayContaining(['svg', 'png', 'pdf']));
  });

  it('does not support other formats', () => {
    expect(bpmnProvider.supportedFormats).not.toContain('jpg');
  });

  it('defaults to svg', () => {
    expect(bpmnProvider.defaultFormat).toBe('svg');
  });
});

describe('bpmnProvider.check', () => {
  it('returns available when bpmn-to-image binary is found', () => {
    mockSpawnSync.mockReturnValue({ status: 1, error: undefined } as any);
    expect(bpmnProvider.check().available).toBe(true);
  });

  it('returns unavailable when bpmn-to-image binary is not found', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = bpmnProvider.check();
    expect(result.available).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('includes install hint referencing bpmn-to-image and playwright', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    const result = bpmnProvider.check();
    expect(result.message).toMatch(/bpmn-to-image/i);
    expect(result.message).toMatch(/playwright/i);
  });
});

describe('bpmnProvider.generate', () => {
  it('calls bpmn-to-image with file:output argument for svg', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    bpmnProvider.generate('/repo/process.bpmn', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'bpmn-to-image',
      ['/repo/process.bpmn:/repo/diagrams/process.svg'],
      expect.any(Object),
    );
  });

  it('calls bpmn-to-image with file:output argument for png', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    bpmnProvider.generate('/repo/process.bpmn', '/repo/diagrams', 'png');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'bpmn-to-image',
      ['/repo/process.bpmn:/repo/diagrams/process.png'],
      expect.any(Object),
    );
  });

  it('calls bpmn-to-image with file:output argument for pdf', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    bpmnProvider.generate('/repo/process.bpmn', '/repo/diagrams', 'pdf');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'bpmn-to-image',
      ['/repo/process.bpmn:/repo/diagrams/process.pdf'],
      expect.any(Object),
    );
  });

  it('uses the source filename without its extension for the output filename', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    bpmnProvider.generate('/repo/order-flow.bpmn', '/repo/diagrams', 'svg');
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'bpmn-to-image',
      ['/repo/order-flow.bpmn:/repo/diagrams/order-flow.svg'],
      expect.any(Object),
    );
  });

  it('throws on unsupported format', () => {
    expect(() => bpmnProvider.generate('/repo/process.bpmn', '/out', 'jpg')).toThrow(
      /does not support format/,
    );
  });

  it('throws with stderr when bpmn-to-image exits non-zero', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: 'render failed', stdout: '', error: undefined } as any);
    expect(() => bpmnProvider.generate('/repo/process.bpmn', '/out', 'png')).toThrow('render failed');
  });

  it('falls back to stdout when stderr is empty', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', stdout: 'Could not parse BPMN.', error: undefined } as any);
    expect(() => bpmnProvider.generate('/repo/process.bpmn', '/out', 'png')).toThrow('Could not parse BPMN.');
  });

  it('throws with error message when spawn fails', () => {
    mockSpawnSync.mockReturnValue({ status: null, error: new Error('ENOENT') } as any);
    expect(() => bpmnProvider.generate('/repo/process.bpmn', '/out', 'png')).toThrow('ENOENT');
  });

  it('throws with fallback message when no stderr, stdout or error', () => {
    mockSpawnSync.mockReturnValue({ status: 1, stderr: '', stdout: '', error: undefined } as any);
    expect(() => bpmnProvider.generate('/repo/process.bpmn', '/out', 'png')).toThrow('bpmn render failed');
  });

  it('input file is the first part of the colon argument', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    bpmnProvider.generate('/repo/process.bpmn', '/repo/diagrams', 'png');
    const args = mockSpawnSync.mock.calls[1][1] as string[];
    expect(args[0].split(':')[0]).toBe('/repo/process.bpmn');
  });

  it('output file is the second part of the colon argument', () => {
    mockSpawnSync.mockReturnValue({ status: 0 } as any);
    bpmnProvider.generate('/repo/process.bpmn', '/repo/diagrams', 'png');
    const args = mockSpawnSync.mock.calls[1][1] as string[];
    expect(args[0].split(':')[1]).toBe('/repo/diagrams/process.png');
  });
});
