import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMToolBridge, OpenAITool, AnthropicTool } from '../src/llm-tool-bridge';
import { AlpParser, type AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';

// Mock the parser module so we can inject inline AlpObject arrays without
// depending on the real parser. We spy on the prototype `parse` method after
// each test so individual tests can control its return value / behavior.
vi.mock('@autonomous-lifecycle-protocol-alp/parser', () => {
  return {
    AlpParser: class {
      parse(): any[] {
        return [];
      }
    },
  };
});

const parseSpy = vi.spyOn(AlpParser.prototype, 'parse');

function makeBridge(): LLMToolBridge {
  return new LLMToolBridge();
}

beforeEach(() => {
  parseSpy.mockReset();
});

describe('LLMToolBridge — toOpenAITools', () => {
  it('should parse an ALP string and produce correct OpenAI tool definitions', () => {
    const objects: AlpObject[] = [
      { _type: 'task', id: 't1', description: 'first task' },
      { _type: 'policy', id: 'p1' },
    ];
    parseSpy.mockReturnValue(objects);

    const result = makeBridge().toOpenAITools('@task t1 {} @policy p1 {}');

    expect(parseSpy).toHaveBeenCalledWith('@task t1 {} @policy p1 {}');
    expect(result).toHaveLength(2);

    expect(result[0]).toEqual<OpenAITool>({
      type: 'function',
      function: {
        name: 'alp_task_t1',
        description: "ALP @task 't1': first task",
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'Action to take on this task',
              enum: ['start', 'complete', 'block', 'review', 'skip'],
            },
            message: { type: 'string', description: 'Status update or completion message' },
          },
          required: ['action'],
        },
      },
    });

    expect(result[1].function.name).toBe('alp_policy_p1');
    expect(result[1].function.parameters.required).toEqual([]);
  });

  it('should propagate errors thrown by the parser (invalid ALP string)', () => {
    parseSpy.mockImplementation(() => {
      throw new Error('SyntaxError: unexpected token at line 3');
    });

    const bridge = makeBridge();
    expect(() => bridge.toOpenAITools('@task broken }}}')).toThrow(/unexpected token/);
  });
});

describe('LLMToolBridge — toAnthropicTools', () => {
  it('should parse an ALP string and produce correct Anthropic tool definitions', () => {
    const objects: AlpObject[] = [
      { _type: 'workflow', id: 'wf1', description: 'deploy flow' },
    ];
    parseSpy.mockReturnValue(objects);

    const result = makeBridge().toAnthropicTools('@workflow wf1 {}');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<AnthropicTool>({
      name: 'alp_workflow_wf1',
      description: "ALP @workflow 'wf1': deploy flow",
      input_schema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Workflow action',
            enum: ['trigger', 'status', 'cancel'],
          },
        },
        required: ['action'],
      },
    });
  });

  it('should propagate parser errors for invalid ALP strings', () => {
    parseSpy.mockImplementation(() => {
      throw new Error('IndentationError: bad indent');
    });

    expect(() => makeBridge().toAnthropicTools('bad')).toThrow(/IndentationError/);
  });
});

describe('LLMToolBridge — objectsToOpenAI', () => {
  it('should convert a pre-parsed object array to OpenAI tools', () => {
    const objects: AlpObject[] = [
      { _type: 'agent', id: 'a1', description: 'helper' },
      { _type: 'task', id: 't2' },
    ];

    const result = makeBridge().objectsToOpenAI(objects);

    // Parser must NOT be invoked when objects are supplied directly.
    expect(parseSpy).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].function.name).toBe('alp_agent_a1');
    expect(result[0].function.parameters.required).toContain('instruction');
    expect(result[1].function.name).toBe('alp_task_t2');
  });
});

describe('LLMToolBridge — objectsToAnthropic', () => {
  it('should convert a pre-parsed object array to Anthropic tools', () => {
    const objects: AlpObject[] = [
      { _type: 'policy', id: 'p9', description: 'lint policy' },
    ];

    const result = makeBridge().objectsToAnthropic(objects);

    expect(parseSpy).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('alp_policy_p9');
    expect(result[0].description).toContain('lint policy');
    expect(result[0].input_schema.required).toEqual([]);
  });
});

describe('LLMToolBridge — toSystemPrompt', () => {
  it('should group objects by _type with counts', () => {
    const objects: AlpObject[] = [
      { _type: 'task', id: 't1' },
      { _type: 'task', id: 't2' },
      { _type: 'policy', id: 'p1' },
    ];

    const prompt = makeBridge().toSystemPrompt(objects);

    expect(prompt).toContain('# ALP Workspace Context');
    expect(prompt).toContain('Total objects: 3');
    expect(prompt).toContain('## @task (2)');
    expect(prompt).toContain('## @policy (1)');
  });

  it('should include status and description for each object', () => {
    const objects: AlpObject[] = [
      { _type: 'task', id: 't1', status: 'in_progress', description: 'write tests' },
      { _type: 'task', id: 't2' },
    ];

    const prompt = makeBridge().toSystemPrompt(objects);

    // status and description both rendered
    expect(prompt).toContain('- **t1** in_progress — write tests');
    // object with neither status nor description shows only the id
    expect(prompt).toContain('- **t2**');
  });

  it('should render a description without status correctly', () => {
    const objects: AlpObject[] = [
      { _type: 'policy', id: 'p1', description: 'keep codebase clean' },
    ];

    const prompt = makeBridge().toSystemPrompt(objects);

    expect(prompt).toContain('- **p1** — keep codebase clean');
  });
});

describe('LLMToolBridge — extractToolSchema (via objectToOpenAI/Anthropic)', () => {
  const cases: Array<{
    type: string;
    expectedRequired: string[];
    expectedProps: string[];
  }> = [
    { type: 'task', expectedRequired: ['action'], expectedProps: ['action', 'message'] },
    { type: 'workflow', expectedRequired: ['action'], expectedProps: ['action'] },
    { type: 'agent', expectedRequired: ['instruction'], expectedProps: ['instruction'] },
    { type: 'policy', expectedRequired: [], expectedProps: ['check_path', 'check_command'] },
    { type: 'contract', expectedRequired: ['action'], expectedProps: ['action'] },
  ];

  for (const c of cases) {
    it(`should generate type-specific parameters for @${c.type}`, () => {
      const obj: AlpObject = { _type: c.type, id: 'obj1', description: 'd' };
      const oai = makeBridge().objectsToOpenAI([obj])[0];
      const anth = makeBridge().objectsToAnthropic([obj])[0];

      expect(Object.keys(oai.function.parameters.properties).sort()).toEqual(
        [...c.expectedProps].sort(),
      );
      expect(oai.function.parameters.required).toEqual(c.expectedRequired);
      expect(anth.input_schema.required).toEqual(c.expectedRequired);
      expect(Object.keys(anth.input_schema.properties).sort()).toEqual(
        [...c.expectedProps].sort(),
      );
    });
  }

  it('should populate required fields for each known type', () => {
    const result = makeBridge().objectsToOpenAI([
      { _type: 'task', id: 't' },
      { _type: 'workflow', id: 'w' },
      { _type: 'agent', id: 'a' },
      { _type: 'policy', id: 'p' },
    ]);

    const byName = Object.fromEntries(
      result.map((r) => [r.function.name, r.function.parameters.required]),
    );
    expect(byName['alp_task_t']).toEqual(['action']);
    expect(byName['alp_workflow_w']).toEqual(['action']);
    expect(byName['alp_agent_a']).toEqual(['instruction']);
    expect(byName['alp_policy_p']).toEqual([]);
  });

  it('should strip special characters from generated tool names', () => {
    const obj: AlpObject = { _type: 'task', id: 'my task #1! (urgent)' };
    const oai = makeBridge().objectsToOpenAI([obj])[0];

    const expected = `alp_task_${obj.id}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 64);
    expect(oai.function.name).toBe(expected);
    expect(oai.function.name).not.toMatch(/[^a-zA-Z0-9_]/);
  });

  it('should truncate generated tool names to 64 characters', () => {
    const longId = 'x'.repeat(120);
    const obj: AlpObject = { _type: 'task', id: longId };
    const oai = makeBridge().objectsToOpenAI([obj])[0];

    const expected = `alp_task_${longId}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 64);
    expect(oai.function.name).toBe(expected);
    expect(oai.function.name.length).toBe(64);
  });

  it('should fall back to a default description when none is provided', () => {
    const obj: AlpObject = { _type: 'task', id: 't1' };
    const oai = makeBridge().objectsToOpenAI([obj])[0];

    expect(oai.function.description).toBe("Execute ALP @task 't1'");
  });
});
