#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { Command } from 'commander';
import { loadConfig } from './config';
import { discoverFiles, discoverChangedFiles } from './discover';
import { generateDiagrams } from './generate';

const { version } = JSON.parse(
	fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
) as { version: string };

const program = new Command();

program
	.name('diagram-sync')
	.description('Keep architecture diagrams synchronized with source code.')
	.version(version)
	.option('-c, --config <path>', 'path to config file', 'diagram-sync.config.json')
	.option('-f, --format <format>', 'output format override (png, svg, pdf, ...)')
	.option('--files <paths...>', 'specific files to process — skips discovery (paths relative to cwd)')
	.option('--changed', 'process only files changed since the last commit (git diff HEAD + untracked)')
	.action((options: { config: string; format?: string; files?: string[]; changed?: boolean }) => {
		const root = process.cwd();
		const explicitConfig = process.argv.some((a) => a === '--config' || a.startsWith('--config=') || a === '-c');
		const config = loadConfig(options.config, explicitConfig);
		const files = options.changed
			? discoverChangedFiles(root, config)
			: options.files
				? options.files.map((f) => path.resolve(root, f))
				: discoverFiles(root, config);
		generateDiagrams(files, root, config, options.format);
	});

program.parse();
