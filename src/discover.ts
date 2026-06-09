import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { type Config } from './config';
import { allExtensions, getProvider } from './providers';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'diagrams']);

export function discoverFiles(root: string, config: Config): string[] {
	const activeTypes = new Set(config.jobs.map((j) => j.type));
	const extensions = new Set(
		allExtensions().filter((ext) => {
			const provider = getProvider(ext);
			return provider && activeTypes.has(provider.name);
		})
	);
	const results: string[] = [];
	walk(root, extensions, results);
	return results;
}

export function discoverChangedFiles(root: string, config: Config): string[] {
	const activeTypes = new Set(config.jobs.map((j) => j.type));
	const extensions = new Set(
		allExtensions().filter((ext) => {
			const provider = getProvider(ext);
			return provider && activeTypes.has(provider.name);
		})
	);

	const tracked = spawnSync('git', ['diff', 'HEAD', '--name-only'], { encoding: 'utf-8', cwd: root });
	if (tracked.error || tracked.status !== 0) {
		return [];
	}

	const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf-8', cwd: root });

	return [
		...(tracked.stdout?.split('\n') ?? []),
		...(untracked.stdout?.split('\n') ?? []),
	]
		.map((f) => f.trim())
		.filter(Boolean)
		.map((f) => path.resolve(root, f))
		.filter((f) => extensions.has(path.extname(f)));
}

function walk(dir: string, extensions: Set<string>, results: string[]): void {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isDirectory()) {
			if (IGNORE_DIRS.has(entry.name)) continue;
			walk(path.join(dir, entry.name), extensions, results);
		} else if (entry.isFile()) {
			if (extensions.has(path.extname(entry.name))) {
				results.push(path.join(dir, entry.name));
			}
		}
	}
}
