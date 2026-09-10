/**
 * LLMToolBridge — v80.0.0 Native LLM Tool Definitions Generator
 *
 * Converts ALP workspace objects (tasks, policies, contracts, workflows)
 * into standard tool/function definitions for:
 * - OpenAI Function Calling (`tools: [...]`)
 * - Anthropic Tool Use (`tools: [...]`)
 *
 * This allows any LLM to natively execute ALP workflows without wrappers.
 */

import {
  AlpParser,
  AlpObject,
} from '@autonomous-lifecycle-protocol-alp/parser';

// ── OpenAI Format ──────────────────────────────────────────────────────

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string; enum?: string[] }>;
      required: string[];
    };
  };
}

// ── Anthropic Format ───────────────────────────────────────────────────

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

// ── Bridge ──────────────────────────────────────────────────────────────

export class LLMToolBridge {
  private parser: AlpParser;

  constructor() {
    this.parser = new AlpParser();
  }

  /**
   * Parse an ALP spec and generate OpenAI-compatible tool definitions.
   */
  public toOpenAITools(alpContent: string): OpenAITool[] {
    const objects = this.parser.parse(alpContent);
    return objects.map((obj) => this.objectToOpenAI(obj));
  }

  /**
   * Parse an ALP spec and generate Anthropic-compatible tool definitions.
   */
  public toAnthropicTools(alpContent: string): AnthropicTool[] {
    const objects = this.parser.parse(alpContent);
    return objects.map((obj) => this.objectToAnthropic(obj));
  }

  /**
   * Convert pre-parsed objects to OpenAI tools.
   */
  public objectsToOpenAI(objects: AlpObject[]): OpenAITool[] {
    return objects.map((obj) => this.objectToOpenAI(obj));
  }

  /**
   * Convert pre-parsed objects to Anthropic tools.
   */
  public objectsToAnthropic(objects: AlpObject[]): AnthropicTool[] {
    return objects.map((obj) => this.objectToAnthropic(obj));
  }

  /**
   * Generate a system prompt context block from ALP objects.
   */
  public toSystemPrompt(objects: AlpObject[]): string {
    const sections: string[] = [
      '# ALP Workspace Context',
      '',
      `Total objects: ${objects.length}`,
      '',
    ];

    const byType = new Map<string, AlpObject[]>();
    for (const obj of objects) {
      const list = byType.get(obj._type) || [];
      list.push(obj);
      byType.set(obj._type, list);
    }

    for (const [type, items] of byType) {
      sections.push(`## @${type} (${items.length})`);
      for (const item of items) {
        const status = item.status ? ` ${item.status}` : '';
        const desc = item.description ? ` — ${item.description}` : '';
        sections.push(`- **${item.id}**${status}${desc}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  // ── Private ───────────────────────────────────────────────────────────

  private objectToOpenAI(obj: AlpObject): OpenAITool {
    const { name, description, properties, required } = this.extractToolSchema(obj);
    return {
      type: 'function',
      function: {
        name,
        description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
      },
    };
  }

  private objectToAnthropic(obj: AlpObject): AnthropicTool {
    const { name, description, properties, required } = this.extractToolSchema(obj);
    return {
      name,
      description,
      input_schema: {
        type: 'object',
        properties,
        required,
      },
    };
  }

  private extractToolSchema(obj: AlpObject): {
    name: string;
    description: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  } {
    const type = obj._type;
    const id = obj.id;
    const name = `alp_${type}_${id}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 64);

    const desc = obj.description
      ? `ALP @${type} '${id}': ${obj.description}`
      : `Execute ALP @${type} '${id}'`;

    const properties: Record<string, { type: string; description: string; enum?: string[] }> = {};
    const required: string[] = [];

    // Common action parameter
    if (type === 'task') {
      properties['action'] = {
        type: 'string',
        description: 'Action to take on this task',
        enum: ['start', 'complete', 'block', 'review', 'skip'],
      };
      properties['message'] = {
        type: 'string',
        description: 'Status update or completion message',
      };
      required.push('action');
    } else if (type === 'policy') {
      properties['check_path'] = {
        type: 'string',
        description: 'File path to check against this policy',
      };
      properties['check_command'] = {
        type: 'string',
        description: 'Shell command to check against this policy',
      };
    } else if (type === 'workflow') {
      properties['action'] = {
        type: 'string',
        description: 'Workflow action',
        enum: ['trigger', 'status', 'cancel'],
      };
      required.push('action');
    } else if (type === 'agent') {
      properties['instruction'] = {
        type: 'string',
        description: `Instruction for agent '${id}'`,
      };
      required.push('instruction');
    } else {
      // Generic for any other type
      properties['action'] = {
        type: 'string',
        description: `Action to perform on @${type} '${id}'`,
      };
      required.push('action');
    }

    return { name, description: desc, properties, required };
  }
}
