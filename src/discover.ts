import fs from 'fs';
import path from 'path';
import { Config } from './config';
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
