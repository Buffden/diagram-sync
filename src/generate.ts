import fs from 'fs';
import path from 'path';
import { log } from './logger';
import { allExtensions, getProvider } from './providers';
import { type Config, type Job, resolveFormat } from './config';
import { type DiagramProvider } from './providers/types';

function getJob(config: Config, providerName: string): Job | undefined {
	return config.jobs.find((j) => j.type === providerName);
}

export interface GenerateResult {
	success: number;
	failed: number;
}

type FormatChoice =
	| { ok: true; format: string; requested: string; fellBack: boolean }
	| { ok: false; requested: string };

function chooseFormat(provider: DiagramProvider, config: Config, cliFormat?: string): FormatChoice {
	const job = getJob(config, provider.name);
	const requested = resolveFormat(job ?? { name: provider.name, type: provider.name }, config, cliFormat);
	if (provider.supportedFormats.includes(requested)) {
		return { ok: true, format: requested, requested, fellBack: false };
	}
	const isExplicit = !!(cliFormat ?? job?.format ?? config.format);
	if (isExplicit) {
		return { ok: false, requested };
	}
	return { ok: true, format: provider.defaultFormat, requested, fellBack: true };
}

function outputPath(file: string, root: string, format: string): string {
	const relative = path.relative(root, file);
	return path.join(root, 'diagrams', relative.replace(/\.[^.]+$/, '.' + format));
}

/**
 * Warns when two sources map to the same output file, e.g. architecture.puml and
 * architecture.excalidraw both rendering to architecture.svg. Same-named siblings
 * on disk are included, so a run over only the changed files still notices a
 * clash with a source that didn't change.
 */
function warnOnOutputClashes(files: string[], root: string, config: Config, cliFormat?: string): void {
	const activeTypes = new Set(config.jobs.map((j) => j.type));
	const activeExtensions = new Set(allExtensions().filter((ext) => activeTypes.has(getProvider(ext)?.name ?? '')));

	const sources = new Set(files);
	for (const file of files) {
		const dir = path.dirname(file);
		const stem = path.basename(file, path.extname(file));
		let entries: string[];
		try {
			entries = fs.readdirSync(dir);
		} catch {
			continue;
		}
		for (const entry of entries) {
			const ext = path.extname(entry);
			if (activeExtensions.has(ext) && path.basename(entry, ext) === stem) {
				sources.add(path.join(dir, entry));
			}
		}
	}

	const byOutput = new Map<string, string[]>();
	for (const source of sources) {
		const provider = getProvider(path.extname(source));
		if (!provider) continue;
		const choice = chooseFormat(provider, config, cliFormat);
		if (!choice.ok) continue;
		const out = outputPath(source, root, choice.format);
		byOutput.set(out, [...(byOutput.get(out) ?? []), source]);
	}

	for (const [out, clashing] of byOutput) {
		if (clashing.length > 1) {
			log.warn(
				`Output clash: ${clashing.map((f) => path.relative(root, f)).join(' and ')} ${clashing.length === 2 ? 'both' : 'all'} write ` +
				`${path.relative(root, out)}; the last one rendered wins. Rename one of the sources.`,
			);
		}
	}
}

export function generateDiagrams(files: string[], root: string, config: Config, cliFormat?: string): GenerateResult {
	if (files.length === 0) {
		log.warn('No diagram source files found.');
		return { success: 0, failed: 0 };
	}

	log.info(`Found ${files.length} diagram file(s). Generating images...`);

	const availableProviders = new Set<DiagramProvider>();
	const unavailableProviders = new Set<DiagramProvider>();

	function isAvailable(provider: DiagramProvider): boolean {
		if (availableProviders.has(provider)) return true;
		if (unavailableProviders.has(provider)) return false;
		const check = provider.check();
		if (!check.available) {
			log.warn(check.message ?? `${provider.name} is not available. Skipping ${provider.name} files.`);
			unavailableProviders.add(provider);
			return false;
		}
		availableProviders.add(provider);
		return true;
	}

	warnOnOutputClashes(files, root, config, cliFormat);

	let success = 0;
	let failed = 0;

	for (const file of files) {
		const ext = path.extname(file);
		const provider = getProvider(ext);
		const relative = path.relative(root, file);

		if (!provider) {
			log.warn(`No provider registered for ${ext}, skipping: ${relative}`);
			continue;
		}

		if (!isAvailable(provider)) {
			failed++;
			continue;
		}

		const job = getJob(config, provider.name);
		const choice = chooseFormat(provider, config, cliFormat);
		if (!choice.ok) {
			log.error(`Failed: ${relative}`);
			console.error(`${provider.name} does not support format "${choice.requested}". Supported: ${provider.supportedFormats.join(', ')}`);
			failed++;
			continue;
		}
		if (choice.fellBack) {
			log.warn(`${provider.name} does not support "${choice.requested}", using "${choice.format}" instead`);
		}
		const { format } = choice;

		const outputDir = path.join(root, 'diagrams', path.dirname(relative));
		fs.mkdirSync(outputDir, { recursive: true });

		try {
			const written = provider.generate(file, outputDir, format, { background: job?.background }) || [outputPath(file, root, format)];
			for (const out of written) {
				log.success(`Generated: ${path.relative(root, out)}`);
			}
			success++;
		} catch (err) {
			log.error(`Failed: ${relative}`);
			if (err instanceof Error) console.error(err.message);
			failed++;
		}
	}

	console.log('');
	log.info(`Done. ${success} generated, ${failed} failed.`);
	return { success, failed };
}
