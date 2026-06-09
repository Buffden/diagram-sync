import { spawnSync } from 'child_process';
import { type DiagramProvider } from './types';
import path from 'path';

export const d2Provider: DiagramProvider = {
	name: 'd2',
	extensions: ['.d2'],
	supportedFormats: ['svg', 'png', 'pdf'],
	defaultFormat: 'svg',

	check() {
		const result = spawnSync('d2', ['--version'], { encoding: 'utf-8' });
		if (result.error) {
			return {
				available: false,
				message: 'd2 not found. Install it via: brew install d2 or https://d2lang.com/tour/install',
			};
		}
		return { available: true };
	},

	generate(file: string, outputDir: string, format: string) {
		if (!this.supportedFormats.includes(format)) {
			throw new Error(`d2 does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
		}
		const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + format);
		const result = spawnSync('d2', [file, outputFile], { encoding: 'utf-8' });
		if (result.error || result.status !== 0) {
			throw new Error(result.stderr || result.error?.message || 'd2 render failed');
		}
	},
};
