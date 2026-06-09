import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { type DiagramProvider } from './types';
import path from 'path';

let cachedBin: string | undefined;

function resolveBpmnBin(): string {
	if (cachedBin !== undefined) return cachedBin;
	const npmPrefix = spawnSync('npm', ['config', 'get', 'prefix'], { encoding: 'utf-8' });
	if (!npmPrefix.error && npmPrefix.status === 0 && npmPrefix.stdout) {
		const binPath = path.join(npmPrefix.stdout.trim(), 'bin', 'bpmn-to-image');
		if (existsSync(binPath)) {
			cachedBin = binPath;
			return cachedBin;
		}
	}
	cachedBin = 'bpmn-to-image';
	return cachedBin;
}

export const bpmnProvider: DiagramProvider = {
	name: 'bpmn',
	extensions: ['.bpmn'],
	supportedFormats: ['svg', 'png', 'pdf'],
	defaultFormat: 'svg',

	check() {
		const bin = resolveBpmnBin();
		const result = spawnSync(bin, [], { encoding: 'utf-8' });
		if (result.error) {
			return {
				available: false,
				message: 'bpmn-to-image not found. Install via: npm install -g bpmn-to-image',
			};
		}
		return { available: true };
	},

	generate(file: string, outputDir: string, format: string) {
		if (!this.supportedFormats.includes(format)) {
			throw new Error(`bpmn does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
		}
		const bin = resolveBpmnBin();
		const outputFile = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + format);
		const result = spawnSync(bin, [`${file}:${outputFile}`], { encoding: 'utf-8' });
		if (result.error || result.status !== 0) {
			throw new Error(result.stderr || result.stdout || result.error?.message || 'bpmn render failed');
		}
	},
};
