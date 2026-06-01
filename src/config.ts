import fs from 'fs';
import path from 'path';

export type DiagramProvider = string;

export interface Job {
  name: string;
  type: DiagramProvider;
}

export interface Config {
  jobs: Job[];
}

const DEFAULT_CONFIG: Config = {
  jobs: [{ name: 'default', type: 'plantuml' }],
};

export function loadConfig(configPath: string): Config {
  const resolved = path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolved)) {
    return DEFAULT_CONFIG;
  }

  const raw = fs.readFileSync(resolved, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<Config>;

  return {
    ...DEFAULT_CONFIG,
    ...parsed,
  };
}
