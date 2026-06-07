import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { discoverFiles } from '../discover';
import { Config } from '../config';

function makeConfig(types: string[]): Config {
  return { jobs: types.map((t) => ({ name: t, type: t })) };
}

describe('discoverFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diagram-sync-discover-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('finds .puml files', () => {
    fs.writeFileSync(path.join(tmpDir, 'flow.puml'), '@startuml\n@enduml');
    const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/flow\.puml$/);
  });

  it('finds .mmd files', () => {
    fs.writeFileSync(path.join(tmpDir, 'flow.mmd'), 'graph TD');
    const files = discoverFiles(tmpDir, makeConfig(['mermaid']));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/flow\.mmd$/);
  });

  it('finds .mermaid files', () => {
    fs.writeFileSync(path.join(tmpDir, 'chart.mermaid'), 'graph LR');
    const files = discoverFiles(tmpDir, makeConfig(['mermaid']));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/chart\.mermaid$/);
  });

  it('finds .plantuml files', () => {
    fs.writeFileSync(path.join(tmpDir, 'arch.plantuml'), '@startuml\n@enduml');
    const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/arch\.plantuml$/);
  });

  it('finds .dot files', () => {
    fs.writeFileSync(path.join(tmpDir, 'arch.dot'), 'digraph {}');
    const files = discoverFiles(tmpDir, makeConfig(['graphviz']));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/arch\.dot$/);
  });

  it('finds .gv files', () => {
    fs.writeFileSync(path.join(tmpDir, 'pipeline.gv'), 'digraph {}');
    const files = discoverFiles(tmpDir, makeConfig(['graphviz']));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/pipeline\.gv$/);
  });

  it('finds .drawio files', () => {
    fs.writeFileSync(path.join(tmpDir, 'arch.drawio'), '<mxfile/>');
    const files = discoverFiles(tmpDir, makeConfig(['drawio']));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/arch\.drawio$/);
  });

  it('finds .dio files', () => {
    fs.writeFileSync(path.join(tmpDir, 'flow.dio'), '<mxfile/>');
    const files = discoverFiles(tmpDir, makeConfig(['drawio']));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/flow\.dio$/);
  });

  it('finds files in subdirectories', () => {
    const subDir = path.join(tmpDir, 'src', 'flows');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'auth.puml'), '@startuml\n@enduml');
    const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
    expect(files).toHaveLength(1);
    expect(files[0]).toContain(path.join('src', 'flows', 'auth.puml'));
  });

  it('ignores node_modules', () => {
    const nm = path.join(tmpDir, 'node_modules', 'some-pkg');
    fs.mkdirSync(nm, { recursive: true });
    fs.writeFileSync(path.join(nm, 'flow.puml'), '@startuml\n@enduml');
    const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
    expect(files).toHaveLength(0);
  });

  it('ignores diagrams directory', () => {
    const diagrams = path.join(tmpDir, 'diagrams');
    fs.mkdirSync(diagrams);
    fs.writeFileSync(path.join(diagrams, 'flow.puml'), '@startuml\n@enduml');
    const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
    expect(files).toHaveLength(0);
  });

  it('ignores .git directory', () => {
    const git = path.join(tmpDir, '.git');
    fs.mkdirSync(git);
    fs.writeFileSync(path.join(git, 'hook.puml'), '@startuml\n@enduml');
    const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
    expect(files).toHaveLength(0);
  });

  it('does not find files for inactive providers', () => {
    fs.writeFileSync(path.join(tmpDir, 'flow.puml'), '@startuml\n@enduml');
    fs.writeFileSync(path.join(tmpDir, 'chart.mmd'), 'graph TD');
    const files = discoverFiles(tmpDir, makeConfig(['mermaid']));
    expect(files.every((f) => f.endsWith('.mmd'))).toBe(true);
  });

  it('returns empty array when no matching files', () => {
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# hi');
    const files = discoverFiles(tmpDir, makeConfig(['plantuml']));
    expect(files).toHaveLength(0);
  });

  it('finds files across multiple active providers', () => {
    fs.writeFileSync(path.join(tmpDir, 'flow.puml'), '@startuml\n@enduml');
    fs.writeFileSync(path.join(tmpDir, 'chart.mmd'), 'graph TD');
    fs.writeFileSync(path.join(tmpDir, 'arch.dot'), 'digraph {}');
    fs.writeFileSync(path.join(tmpDir, 'system.drawio'), '<mxfile/>');
    const files = discoverFiles(tmpDir, makeConfig(['plantuml', 'mermaid', 'graphviz', 'drawio']));
    expect(files).toHaveLength(4);
  });
});
