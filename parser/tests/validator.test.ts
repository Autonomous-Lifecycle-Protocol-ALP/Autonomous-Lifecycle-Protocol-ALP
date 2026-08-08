import { describe, it, expect } from 'vitest';
import { AlpValidator } from '../src/validator';
import { ValidationError } from '../src/error';

describe('AlpValidator', () => {
  const validator = new AlpValidator();

  const validTask = {
    _type: 'task' as const,
    id: 'task-1',
    description: 'A valid task',
    status: '[ ]',
  };

  it('validates a well-formed object', () => {
    expect(() => validator.validate(validTask)).not.toThrow();
  });

  it('throws when id is missing', () => {
    expect(() => validator.validate({ ...validTask, id: '' })).toThrow(ValidationError);
  });

  it('throws when no schema exists for the type', () => {
    expect(() => validator.validate({ ...validTask, _type: 'nonexistent' as any })).toThrow(
      /No schema found/
    );
  });
});
