export interface GenerateOptions {
	background?: string;
}

export interface DiagramProvider {
	name: string;
	extensions: string[];
	supportedFormats: string[];
	defaultFormat: string;
	check(): {
		available: boolean;
		message?: string;
	};
	/**
	 * Renders `file` into `outputDir`. A provider that can't pick the output name
	 * directly returns the absolute paths it wrote; otherwise the output is
	 * `<outputDir>/<source basename>.<format>`.
	 */
	generate(file: string, outputDir: string, format: string, options?: GenerateOptions): string[] | void;
}
