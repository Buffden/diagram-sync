import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveFormat, loadConfig, Job, Config } from '../config';

describe('resolveFormat', () => {
  const job: Job = { name: 'test', type: 'plantuml' };
  const config: Config = { jobs: [] };

  it('returns cli format when provided', () => {
    expect(resolveFormat(job, config, 'svg')).toBe('svg');
  });

  it('cli format overrides job and global format', () => {
    expect(resolveFormat({ ...job, format: 'pdf' }, { ...config, format: 'eps' }, 'svg')).toBe('svg');
  });

  it('returns job format when no cli format', () => {
    expect(resolveFormat({ ...job, format: 'svg' }, config)).toBe('svg');
  });

  it('job format overrides global format', () => {
    expect(resolveFormat({ ...job, format: 'svg' }, { ...config, format: 'pdf' })).toBe('svg');
  });

  it('returns global format when no cli or job format', () => {
    expect(resolveFormat(job, { ...config, format: 'pdf' })).toBe('pdf');
  });

  it('returns svg as system default when nothing is set', () => {
    expect(resolveFormat(job, config)).toBe('svg');
  });
});

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diagram-sync-config-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns default config when file does not exist', () => {
    const config = loadConfig(path.join(tmpDir, 'nonexistent.json'));
    expect(config.jobs.length).toBeGreaterThan(0);
    expect(config.jobs.every((j) => typeof j.type === 'string')).toBe(true);
  });

  it('default config includes all registered providers', () => {
    const config = loadConfig(path.join(tmpDir, 'nonexistent.json'));
    const types = config.jobs.map((j) => j.type);
    expect(types).toContain('plantuml');
    expect(types).toContain('mermaid');
    expect(types).toContain('graphviz');
    expect(types).toContain('drawio');
  });

  it('parses a valid config file', () => {
    const configPath = path.join(tmpDir, 'diagram-sync.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      format: 'svg',
      jobs: [{ name: 'arch', type: 'plantuml', format: 'pdf' }],
    }));
    const config = loadConfig(configPath);
    expect(config.format).toBe('svg');
    expect(config.jobs.find((j) => j.type === 'plantuml')?.format).toBe('pdf');
  });

  it('throws on invalid JSON', () => {
    const configPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(configPath, '{ invalid json }');
    expect(() => loadConfig(configPath)).toThrow('Failed to parse config file');
  });

  it('merges missing providers into user config', () => {
    const configPath = path.join(tmpDir, 'diagram-sync.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      jobs: [{ name: 'arch', type: 'plantuml' }],
    }));
    const config = loadConfig(configPath);
    expect(config.jobs.some((j) => j.type === 'mermaid')).toBe(true);
    expect(config.jobs.some((j) => j.type === 'graphviz')).toBe(true);
    expect(config.jobs.some((j) => j.type === 'drawio')).toBe(true);
  });

  it('does not duplicate providers already in user config', () => {
    const configPath = path.join(tmpDir, 'diagram-sync.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      jobs: [
        { name: 'arch', type: 'plantuml' },
        { name: 'flows', type: 'mermaid' },
      ],
    }));
    const config = loadConfig(configPath);
    expect(config.jobs.filter((j) => j.type === 'plantuml')).toHaveLength(1);
    expect(config.jobs.filter((j) => j.type === 'mermaid')).toHaveLength(1);
    expect(config.jobs.filter((j) => j.type === 'graphviz')).toHaveLength(1);
    expect(config.jobs.filter((j) => j.type === 'drawio')).toHaveLength(1);
  });
});
