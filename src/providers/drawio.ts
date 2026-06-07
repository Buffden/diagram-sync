import { spawnSync } from 'child_process';
import { DiagramProvider } from './types';
import path from 'path';

export const drawioProvider: DiagramProvider = {
    name: 'drawio',
    extensions: ['.drawio', '.dio'],
    supportedFormats: ['svg', 'png', 'jpg', 'jpeg', 'pdf'],
    defaultFormat: 'svg',

    check() {
        const result = spawnSync('drawio', ['--version'], { encoding: 'utf-8' });
        if (result.error) {
            return {
                available: false,
                message: 'drawio not found. Install it from https://www.drawio.com or via: brew install --cask drawio',
            };
        }
        return { available: true };
    },

    generate(file: string, outputDir: string, format: string) {
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`drawio does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
        }
        const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + format);
        const args = process.env.CI
            ? ['--no-sandbox', '--disable-gpu', '--export', '--format', format, '--output', outputFile, file]
            : ['--export', '--format', format, '--output', outputFile, file];
        const result = spawnSync('drawio', args, { encoding: 'utf-8' });
        if (result.error || result.status !== 0) {
            throw new Error(result.stderr || result.error?.message || 'drawio render failed');
        }
    },
};