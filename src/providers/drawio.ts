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
        if (process.platform === 'linux' && !process.env.DISPLAY) {
            const xvfb = spawnSync('which', ['xvfb-run'], { encoding: 'utf-8' });
            if (xvfb.status !== 0) {
                return {
                    available: false,
                    message: 'draw.io requires a display or xvfb-run on Linux. Install via: sudo apt-get install -y xvfb',
                };
            }
        }
        return { available: true };
    },

    generate(file: string, outputDir: string, format: string) {
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`drawio does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
        }
        const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + format);
        const drawioArgs = ['--no-sandbox', '--disable-gpu', '--export', '--format', format, '--output', outputFile, file];

        const useXvfb = process.platform === 'linux' && !process.env.DISPLAY;
        const cmd = useXvfb ? 'xvfb-run' : 'drawio';
        const args = useXvfb ? ['-a', 'drawio', ...drawioArgs] : drawioArgs;

        const result = spawnSync(cmd, args, { encoding: 'utf-8' });
        if (result.error || result.status !== 0) {
            throw new Error(result.stderr || result.error?.message || 'drawio render failed');
        }
    },
};