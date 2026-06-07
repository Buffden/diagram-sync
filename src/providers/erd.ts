import { spawnSync } from 'child_process';
import { DiagramProvider } from './types';
import path from 'path';

export const erdProvider: DiagramProvider = {
    name: 'erd',
    extensions: ['.er'],
    supportedFormats: ['svg', 'png', 'pdf'],
    defaultFormat: 'svg',

    check() {
        const result = spawnSync('erd', ['--help'], { encoding: 'utf-8' });
        if (result.error) {
            return {
                available: false,
                message: 'erd not found. Install via: brew install erd (macOS) or see https://github.com/BurntSushi/erd for Linux',
            };
        }
        return { available: true };
    },

    generate(file: string, outputDir: string, format: string) {
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`erd does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
        }
        const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + format);
        const result = spawnSync('erd', ['-i', file, '-o', outputFile], { encoding: 'utf-8' });
        if (result.error || result.status !== 0) {
            throw new Error(result.stderr || result.error?.message || 'erd render failed');
        }
    },
};
