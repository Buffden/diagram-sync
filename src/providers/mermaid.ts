import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { DiagramProvider } from './types';

export const mermaidProvider: DiagramProvider = {
  name: 'mermaid',
  extensions: ['.mmd', '.mermaid'],
  supportedFormats: ['png', 'svg', 'pdf'],
  defaultFormat: 'png',

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

  generate(file: string, outputDir: string, format: string) {
    if (!this.supportedFormats.includes(format)) {
      throw new Error(`mermaid does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
    }
    const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + format);
    const args = ['-i', file, '-o', outputFile];
    if (process.env.CI) {
      const configPath = path.join(os.tmpdir(), 'mmdc-puppeteer.json');
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ args: ['--no-sandbox'] }));
      }
      args.push('-p', configPath);
    }
    const result = spawnSync('mmdc', args, { encoding: 'utf-8' });
    if (result.error || result.status !== 0) {
      throw new Error(result.stderr || result.error?.message || 'mermaid render failed');
    }
  },
};
