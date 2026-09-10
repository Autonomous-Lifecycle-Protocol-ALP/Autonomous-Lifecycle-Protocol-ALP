export function alloc(length: number): Uint8Array {
  return new Uint8Array(length);
}

export function from(input: any, _encoding?: string): Uint8Array {
  if (typeof input === 'string') {
    return new TextEncoder().encode(input);
  }
  if (Array.isArray(input) || input instanceof Uint8Array || input instanceof ArrayBuffer) {
    return Uint8Array.from(input as any);
  }
  return new Uint8Array();
}

export function isBuffer(obj: any): boolean {
  return obj instanceof Uint8Array;
}

export function fromString(input: string, _encoding?: string): Uint8Array {
  return new TextEncoder().encode(input);
}

export function toString(buffer: Uint8Array, _encoding?: string): string {
  return new TextDecoder().decode(buffer);
}

export function concat(buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    out.set(b, offset);
    offset += b.length;
  }
  return out;
}

export const Buffer = {
  alloc,
  from,
  isBuffer,
  fromString,
  toString,
  concat,
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

export default Buffer;
