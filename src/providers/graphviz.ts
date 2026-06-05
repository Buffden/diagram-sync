import { spawnSync } from 'child_process';
import { DiagramProvider } from './types';
import path from 'path';

export const graphvizProvider: DiagramProvider = {
    name: 'graphviz',
    extensions: ['.dot', '.gv'],
    supportedFormats: ['png', 'svg', 'eps', 'pdf'],
    defaultFormat: 'svg',

    check() {
        const result = spawnSync('dot', ['-V'], { encoding: 'utf-8' });
        if (result.error) {
            return {
                available: false,
                message: 'graphviz not found. Install it via: brew install graphviz or apt install graphviz',
            };
        }
        return { available: true };
    },

    generate(file: string, outputDir: string, format: string) {
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`graphviz does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
        }
        const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + format);
        const args = ['-T' + format, file, '-o', outputFile];
        const result = spawnSync('dot', args, { encoding: 'utf-8' });
        if (result.error || result.status !== 0) {
            throw new Error(result.stderr || result.error?.message || 'graphviz render failed');
        }
    },
};