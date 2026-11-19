import fs from 'node:fs';
import path from 'node:path';
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
		for (const sibling of sameNamedSiblings(file, activeExtensions)) {
			sources.add(sibling);
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
			warnClash(out, clashing, root);
		}
	}
}

/** Files next to `file` with the same stem and an active diagram extension. */
function sameNamedSiblings(file: string, activeExtensions: Set<string>): string[] {
	const dir = path.dirname(file);
	const stem = path.basename(file, path.extname(file));
	let entries: string[];
	try {
		entries = fs.readdirSync(dir);
	} catch {
		return [];
	}
	return entries
		.filter((entry) => {
			const ext = path.extname(entry);
			return activeExtensions.has(ext) && path.basename(entry, ext) === stem;
		})
		.map((entry) => path.join(dir, entry));
}

function warnClash(out: string, clashing: string[], root: string): void {
	const quantifier = clashing.length === 2 ? 'both' : 'all';
	log.warn(
		`Output clash: ${clashing.map((f) => path.relative(root, f)).join(' and ')} ${quantifier} write ` +
		`${path.relative(root, out)}; the last one rendered wins. Rename one of the sources.`,
	);
}

export function generateDiagrams(files: string[], root: string, config: Config, cliFormat?: string): GenerateResult {
	if (files.length === 0) {
		log.warn('No diagram source files found.');
		return { success: 0, failed: 0 };
	}

	log.info(`Found ${files.length} diagram file(s). Generating images...`);

	const isAvailable = createAvailabilityCheck();
	warnOnOutputClashes(files, root, config, cliFormat);

	let success = 0;
	let failed = 0;

	for (const file of files) {
		const outcome = generateOne(file, root, config, isAvailable, cliFormat);
		if (outcome === 'success') success++;
		else if (outcome === 'failed') failed++;
	}

	console.log('');
	log.info(`Done. ${success} generated, ${failed} failed.`);
	return { success, failed };
}

/** Runs each provider's check() once per run and remembers the result. */
function createAvailabilityCheck(): (provider: DiagramProvider) => boolean {
	const known = new Map<DiagramProvider, boolean>();
	return (provider) => {
		const cached = known.get(provider);
		if (cached !== undefined) return cached;
		const check = provider.check();
		if (!check.available) {
			log.warn(check.message ?? `${provider.name} is not available. Skipping ${provider.name} files.`);
		}
		known.set(provider, check.available);
		return check.available;
	};
}

type Outcome = 'success' | 'failed' | 'skipped';

function generateOne(
	file: string,
	root: string,
	config: Config,
	isAvailable: (provider: DiagramProvider) => boolean,
	cliFormat?: string,
): Outcome {
	const ext = path.extname(file);
	const provider = getProvider(ext);
	const relative = path.relative(root, file);

	if (!provider) {
		log.warn(`No provider registered for ${ext}, skipping: ${relative}`);
		return 'skipped';
	}
	if (!isAvailable(provider)) {
		return 'failed';
	}

	const choice = chooseFormat(provider, config, cliFormat);
	if (!choice.ok) {
		log.error(`Failed: ${relative}`);
		console.error(`${provider.name} does not support format "${choice.requested}". Supported: ${provider.supportedFormats.join(', ')}`);
		return 'failed';
	}
	if (choice.fellBack) {
		log.warn(`${provider.name} does not support "${choice.requested}", using "${choice.format}" instead`);
	}
	const { format } = choice;

	const outputDir = path.join(root, 'diagrams', path.dirname(relative));
	fs.mkdirSync(outputDir, { recursive: true });

	try {
		const background = getJob(config, provider.name)?.background;
		const written = provider.generate(file, outputDir, format, { background }) ?? [outputPath(file, root, format)];
		for (const out of written) {
			log.success(`Generated: ${path.relative(root, out)}`);
		}
		return 'success';
	} catch (err) {
		log.error(`Failed: ${relative}`);
		if (err instanceof Error) console.error(err.message);
		return 'failed';
	}
}
