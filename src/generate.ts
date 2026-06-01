import fs from 'fs';
import path from 'path';
import { log } from './logger';
import { getProvider } from './providers';
import { DiagramProvider } from './providers/types';

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

    if (!isAvailable(provider)) {
      failed++;
      continue;
    }

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
