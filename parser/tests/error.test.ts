import { describe, it, expect } from 'vitest';
import { AlpError, SyntaxError, IndentationError, ValidationError, DirectiveError } from '../src/error';

describe('AlpError', () => {
  it('creates error with message only', () => {
    const error = new AlpError('something went wrong');
    expect(error.message).toBe('something went wrong');
    expect(error.name).toBe('AlpError');
    expect(error.line).toBeUndefined();
    expect(error.column).toBeUndefined();
  });

  it('creates error with line and column', () => {
    const error = new AlpError('parse failure', 10, 5);
    expect(error.message).toBe('parse failure at line 10 column 5');
    expect(error.line).toBe(10);
    expect(error.column).toBe(5);
  });

  it('creates error with line only', () => {
    const error = new AlpError('parse failure', 10);
    expect(error.message).toBe('parse failure at line 10');
    expect(error.line).toBe(10);
    expect(error.column).toBeUndefined();
  });

  it('is an instance of Error', () => {
    const error = new AlpError('test');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('SyntaxError', () => {
  it('creates syntax error with message', () => {
    const error = new SyntaxError('unexpected token');
    expect(error.message).toBe('unexpected token');
    expect(error.name).toBe('SyntaxError');
    expect(error).toBeInstanceOf(AlpError);
  });

  it('creates syntax error with location', () => {
    const error = new SyntaxError('unexpected token', 3, 1);
    expect(error.message).toBe('unexpected token at line 3 column 1');
    expect(error.line).toBe(3);
    expect(error.column).toBe(1);
  });
});

describe('IndentationError', () => {
  it('creates indentation error with message', () => {
    const error = new IndentationError('unexpected indent');
    expect(error.message).toBe('unexpected indent');
    expect(error.name).toBe('IndentationError');
    expect(error).toBeInstanceOf(AlpError);
  });

  it('creates indentation error with location', () => {
    const error = new IndentationError('bad indent', 7);
    expect(error.message).toBe('bad indent at line 7');
    expect(error.line).toBe(7);
  });
});

describe('ValidationError', () => {
  it('creates validation error with message', () => {
    const error = new ValidationError('missing id');
    expect(error.message).toBe('missing id');
    expect(error.name).toBe('ValidationError');
    expect(error).toBeInstanceOf(AlpError);
  });

  it('stores details payload', () => {
    const details = { field: 'id', expected: 'string' };
    const error = new ValidationError('invalid type', details, 2);
    expect(error.details).toBe(details);
    expect(error.line).toBe(2);
  });

  it('creates validation error without details', () => {
    const error = new ValidationError('generic failure');
    expect(error.details).toBeUndefined();
  });
});

describe('DirectiveError', () => {
  it('creates directive error with message', () => {
    const error = new DirectiveError('unknown directive');
    expect(error.message).toBe('unknown directive');
    expect(error.name).toBe('DirectiveError');
    expect(error).toBeInstanceOf(AlpError);
  });

  it('creates directive error with location', () => {
    const error = new DirectiveError('bad directive', 1, 10);
    expect(error.message).toBe('bad directive at line 1 column 10');
    expect(error.line).toBe(1);
    expect(error.column).toBe(10);
  });
});
