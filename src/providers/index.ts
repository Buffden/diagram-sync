import { type DiagramProvider } from './types';
import { plantumlProvider } from './plantuml';
import { mermaidProvider } from './mermaid';
import { graphvizProvider } from './graphviz';
import { drawioProvider } from './drawio';
import { d2Provider } from './d2';
import { excalidrawProvider } from './excalidraw';
import { bpmnProvider } from './bpmn';

const registry: DiagramProvider[] = [
	plantumlProvider,
	mermaidProvider,
	graphvizProvider,
	drawioProvider,
	d2Provider,
	excalidrawProvider,
	bpmnProvider,
];

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
