import { DiagramProvider } from './types';
import { plantumlProvider } from './plantuml';
import { mermaidProvider } from './mermaid';

const registry: DiagramProvider[] = [plantumlProvider, mermaidProvider];

const extensionMap = new Map<string, DiagramProvider>();

for (const provider of registry) {
  for (const ext of provider.extensions) {
    extensionMap.set(ext, provider);
  }
}

export function getProvider(extension: string): DiagramProvider | undefined {
  return extensionMap.get(extension);
}

export function allExtensions(): string[] {
  return [...extensionMap.keys()];
}

export function allProviderNames(): string[] {
  return registry.map((p) => p.name);
}
