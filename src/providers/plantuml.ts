import { spawnSync } from 'child_process';
import { DiagramProvider } from './types';

export const plantumlProvider: DiagramProvider = {
  name: 'plantuml',
  extensions: ['.puml', '.plantuml'],

  check() {
    const result = spawnSync('plantuml', ['-version'], { encoding: 'utf-8' });
    if (result.error) {
      return {
        available: false,
        message: 'plantuml not found. Install it via: brew install plantuml  or  apt install plantuml',
      };
    }
    return { available: true };
  },

  generate(file: string, outputDir: string) {
    const result = spawnSync('plantuml', ['-tsvg', '-o', outputDir, file], {
      encoding: 'utf-8',
    });
    if (result.error || result.status !== 0) {
      throw new Error(result.stderr || result.error?.message || 'plantuml render failed');
    }
  },
};
