import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { DiagramProvider } from './types';
import path from 'path';

function resolveExcalidrawBin(): string {
    // Try npm global prefix bin — handles cases where the global bin isn't in PATH
    const npmPrefix = spawnSync('npm', ['config', 'get', 'prefix'], { encoding: 'utf-8' });
    if (!npmPrefix.error && npmPrefix.status === 0 && npmPrefix.stdout) {
        const binPath = path.join(npmPrefix.stdout.trim(), 'bin', 'excalidraw-cli');
        if (existsSync(binPath)) {
            return binPath;
        }
    }
    return 'excalidraw-cli';
}

export const excalidrawProvider: DiagramProvider = {
    name: 'excalidraw',
    extensions: ['.excalidraw'],
    supportedFormats: ['svg', 'png'],
    defaultFormat: 'svg',

    check() {
        const bin = resolveExcalidrawBin();
        const result = spawnSync(bin, ['--help'], { encoding: 'utf-8' });
        if (result.error) {
            return {
                available: false,
                message: 'excalidraw-cli not found. Install via: npm install -g @swiftlysingh/excalidraw-cli',
            };
        }
        return { available: true };
    },

    generate(file: string, outputDir: string, format: string) {
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`excalidraw does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
        }
        const bin = resolveExcalidrawBin();
        const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + format);
        const result = spawnSync(bin, ['convert', file, '--format', format, '-o', outputFile], { encoding: 'utf-8' });
        if (result.error || result.status !== 0) {
            throw new Error(result.stderr || result.stdout || result.error?.message || 'excalidraw render failed');
        }
    },
};
