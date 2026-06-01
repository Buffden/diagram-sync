import fs from 'fs';
import path from 'path';
import { allProviderNames } from './providers';

export type ProviderType = string;

export interface Job {
  name: string;
  type: ProviderType;
}

export interface Config {
  jobs: Job[];
}

function buildDefaultConfig(): Config {
  return {
    jobs: allProviderNames().map((name) => ({ name, type: name })),
  };
}

export function loadConfig(configPath: string): Config {
  const resolved = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolved)) {
    return buildDefaultConfig();
  }

  let parsed: Partial<Config>;

  try {
    parsed = JSON.parse(fs.readFileSync(resolved, 'utf-8')) as Partial<Config>;
  } catch {
    throw new Error(`Failed to parse config file: ${resolved}`);
  }
  const defaults = buildDefaultConfig();

  const configuredTypes = new Set((parsed.jobs ?? []).map((j) => j.type));
  const mergedJobs = [
    ...(parsed.jobs ?? []),
    ...defaults.jobs.filter((j) => !configuredTypes.has(j.type)),
  ];

  return { jobs: mergedJobs };
}
