import { spawnSync } from 'child_process';
import { DiagramProvider } from './types';

const FORMAT_FLAGS: Record<string, string> = {
  png: '-tpng',
  svg: '-tsvg',
  eps: '-teps',
  pdf: '-tpdf',
};

export const plantumlProvider: DiagramProvider = {
  name: 'plantuml',
  extensions: ['.puml', '.plantuml'],
  supportedFormats: ['png', 'svg', 'eps', 'pdf'],
  defaultFormat: 'png',

  check() {
    const result = spawnSync('plantuml', ['-version'], { encoding: 'utf-8' });
    if (result.error || result.status !== 0) {
      return {
        available: false,
        message: 'plantuml not found. Install it via: brew install plantuml or apt install plantuml',
      };
    }
    return { available: true };
  },

  generate(file: string, outputDir: string, format: string) {
    const flag = FORMAT_FLAGS[format];
    if (!flag) {
      throw new Error(`plantuml does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
    }
    const result = spawnSync('plantuml', [flag, '-o', outputDir, file], {
      encoding: 'utf-8',
    });
    if (result.error || result.status !== 0) {
      throw new Error(result.stderr || result.error?.message || 'plantuml render failed');
    }
  },
};
