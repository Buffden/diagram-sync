export interface DiagramProvider {
  name: string;
  extensions: string[];
  check(): {
    available: boolean;
    message?: string
  };
  generate(file: string, outputDir: string): void;
}
