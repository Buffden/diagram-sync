import { spawnSync } from 'child_process';
import path from 'path';
import { DiagramProvider } from './types';

export const mermaidProvider: DiagramProvider = {
  name: 'mermaid',
  extensions: ['.mmd', '.mermaid'],

  check() {
    const result = spawnSync('mmdc', ['--version'], { encoding: 'utf-8' });
    if (result.error || result.status !== 0) {
      return {
        available: false,
        message: 'mmdc not found. Install it via: npm install -g @mermaid-js/mermaid-cli',
      };
    }
    return { available: true };
  },

  generate(file: string, outputDir: string) {
    const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.svg');
    const result = spawnSync('mmdc', ['-i', file, '-o', outputFile], {
      encoding: 'utf-8',
    });
    if (result.error || result.status !== 0) {
      throw new Error(result.stderr || result.error?.message || 'mermaid render failed');
    }
  },
};
