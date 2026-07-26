import { describe, it, expect } from 'vitest';
import { AlpParser } from '@alp/parser';

describe('AlpParser Integration', () => {
  it('should parse a valid ALP document', () => {
    const parser = new AlpParser();
    const content = `
@agent
  id: test-agent
  name: TestAgent
  model: gpt-4

@skill
  id: test-skill
  name: TestSkill
`;
    const result = parser.parse(content);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return warnings for invalid content', () => {
    const parser = new AlpParser();
    const content = 'invalid alp content';
    expect(() => parser.parse(content)).toThrow();
  });

  it('should parse and validate a document', () => {
    const parser = new AlpParser();
    const content = `
@agent
  id: test-agent
  name: TestAgent
  model: gpt-4

@agent
  id: test-agent-2
  name: TestAgent2
  model: claude-3
`;
    const result = parser.parseAndValidate(content);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});