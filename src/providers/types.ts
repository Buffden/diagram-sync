export interface DiagramProvider {
  name: string;
  extensions: string[];
  supportedFormats: string[];
  defaultFormat: string;
  check(): {
    available: boolean;
    message?: string
  };
  generate(file: string, outputDir: string, format: string): void;
}
