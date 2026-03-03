import type {ToolDefinition} from "./types";

export class ToolExecutor {
  private readonly tools: Map<string, ToolDefinition>;
  constructor(tools: ToolDefinition[] = []) {
    this.tools = new Map(tools.map((tool) => [tool.name, tool]));
  }

  registerTool(tool: ToolDefinition) {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAvailableTools(): string {
    return Array.from(this.tools.values())
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join("\n");
  }
}
