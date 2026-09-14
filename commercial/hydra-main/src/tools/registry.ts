export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredCapabilities: string[];
  execute(input: Record<string, unknown>): Promise<unknown>;
}

export abstract class BaseTool implements Tool {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: string;
  abstract readonly requiredCapabilities: string[];
  abstract execute(input: Record<string, unknown>): Promise<unknown>;
}

export class ToolRegistry {
  private readonly tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  listByCategory(category: string): Tool[] {
    return this.list().filter((t) => t.category === category);
  }
}
