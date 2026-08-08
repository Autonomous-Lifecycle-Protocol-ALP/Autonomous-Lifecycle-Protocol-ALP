import { describe, it, expect } from 'vitest';
import { requireChildProcess } from '../src/node-utils';

describe('requireChildProcess', () => {
  it('does not throw in Node.js environment', () => {
    expect(() => requireChildProcess()).not.toThrow();
  });
});
