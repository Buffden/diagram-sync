import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { type DiagramProvider, type GenerateOptions } from './types';

const DEFAULT_BACKGROUND = '#FFFFFF';

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
	defaultFormat: 'svg',

	check() {
		const result = spawnSync('plantuml', ['-version'], { encoding: 'utf-8' });
		if (result.error) {
			return {
				available: false,
				message: 'plantuml not found. Install it via: brew install plantuml or apt install plantuml',
			};
		}
		return { available: true };
	},

	generate(file: string, outputDir: string, format: string, options?: GenerateOptions) {
		const flag = FORMAT_FLAGS[format];
		if (!flag) {
			throw new Error(`plantuml does not support format "${format}". Supported: ${this.supportedFormats.join(', ')}`);
		}
		const bg = options?.background || DEFAULT_BACKGROUND;

		// PlantUML names its output after `@startuml <title>` when a title is given,
		// not after the source file. Render into a scratch folder and copy the result
		// to <source name>.<format> so the output path is predictable.
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diagram-sync-plantuml-'));
		try {
			const result = spawnSync(
				'plantuml',
				[flag, '--skinparam', `backgroundColor=${bg}`, '-o', tmpDir, file],
				{ encoding: 'utf-8' },
			);
			if (result.error || result.status !== 0) {
				throw new Error(result.stderr || result.error?.message || 'plantuml render failed');
			}

			const produced = fs.readdirSync(tmpDir).filter((f) => f.endsWith('.' + format)).sort();
			if (produced.length === 0) {
				throw new Error(`plantuml produced no .${format} output`);
			}

			// A file with several @startuml blocks produces several images; there's no
			// single expected name for those, so they keep PlantUML's names.
			const targets = produced.length === 1
				? [path.join(outputDir, `${path.basename(file, path.extname(file))}.${format}`)]
				: produced.map((f) => path.join(outputDir, f));

			// copy, not rename: the temp folder may be on another filesystem
			produced.forEach((f, i) => fs.copyFileSync(path.join(tmpDir, f), targets[i]));
			return targets;
		} finally {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	},
};
