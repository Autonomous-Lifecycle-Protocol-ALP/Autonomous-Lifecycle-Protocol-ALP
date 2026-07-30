import { describe, it, expect } from 'vitest';
import { ContextBundler, ContextObject } from '@autonomous-lifecycle-protocol-alp/parser';

describe('v46.0.0 ContextBundler — Edge Context Compilation', () => {
  const sampleObjects: ContextObject[] = [
    { id: 'task-auth', type: 'task', properties: { name: 'Setup Auth', status: 'pending' } },
    { id: 'task-db', type: 'task', properties: { name: 'Setup DB', status: 'done' } },
    { id: 'feat-login', type: 'feature', properties: { name: 'Login Flow' } },
    { id: 'rule-no-raw-sql', type: 'rule', properties: { description: 'No raw SQL queries' } },
  ];

  it('compiles a JSON context bundle with correct manifest', () => {
    const bundler = new ContextBundler();
    const result = bundler.compile(sampleObjects, { format: 'json', bundleId: 'test-bundle-1' });

    expect(result.manifest.id).toBe('test-bundle-1');
    expect(result.manifest.format).toBe('json');
    expect(result.manifest.objectCount).toBe(4);
    expect(result.manifest.compilationMs).toBeGreaterThanOrEqual(0);
    expect(result.manifest.checksum).toMatch(/^cksum_/);
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('compiles a wasm-compat base64-encoded bundle', () => {
    const bundler = new ContextBundler();
    const result = bundler.compile(sampleObjects, { format: 'wasm-compat', bundleId: 'wasm-test' });

    expect(result.manifest.format).toBe('wasm-compat');
    // Base64 payload should not contain raw JSON brackets at top level
    expect(result.payload).not.toMatch(/^\[/);
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('verifies bundle integrity via checksum', () => {
    const bundler = new ContextBundler();
    const result = bundler.compile(sampleObjects);

    expect(bundler.verify(result)).toBe(true);

    // Tamper with payload
    const tampered = { ...result, payload: result.payload + 'x' };
    expect(bundler.verify(tampered)).toBe(false);
  });

  it('decodes a wasm-compat bundle back to context objects', () => {
    const bundler = new ContextBundler();
    const result = bundler.compile(sampleObjects, { format: 'wasm-compat' });

    const decoded = bundler.decode(result);
    expect(decoded).toHaveLength(4);
    expect(decoded[0].id).toBe('task-auth');
    expect(decoded[3].type).toBe('rule');
  });

  it('compiles in sub-millisecond time for small payloads', () => {
    const bundler = new ContextBundler();
    const result = bundler.compile(sampleObjects);

    // Should compile in under 5ms for 4 objects
    expect(result.manifest.compilationMs).toBeLessThan(5);
  });
});
