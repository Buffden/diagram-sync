import fs from 'fs';
import path from 'path';
import { log } from './logger';
import { getProvider } from './providers';
import { DiagramProvider } from './providers/types';

const checkedProviders = new Set<DiagramProvider>();

function ensureAvailable(provider: DiagramProvider): void {
  if (checkedProviders.has(provider)) return;
  const check = provider.check();
  if (!check.available) {
    log.error(check.message ?? `${provider.name} is not available.`);
    process.exit(1);
  }
  checkedProviders.add(provider);
}

export function generateDiagrams(files: string[], root: string): void {
  if (files.length === 0) {
    log.warn('No diagram source files found.');
    return;
  }

  log.info(`Found ${files.length} diagram file(s). Generating SVGs...`);

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

    ensureAvailable(provider);

    const outputDir = path.join(root, 'diagrams', path.dirname(relative));
    fs.mkdirSync(outputDir, { recursive: true });

    const outputFile = `diagrams/${relative.replace(/\.[^.]+$/, '.svg')}`;

    try {
      provider.generate(file, outputDir);
      log.success(`Generated: ${outputFile}`);
      success++;
    } catch (err) {
      log.error(`Failed: ${relative}`);
      if (err instanceof Error) console.error(err.message);
      failed++;
    }
  }

  console.log('');
  log.info(`Done. ${success} generated, ${failed} failed.`);
}
