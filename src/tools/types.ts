export interface ToolDefinition {
  name: string;
  description: string;
  execute: (input: string) => Promise<string>;
}
