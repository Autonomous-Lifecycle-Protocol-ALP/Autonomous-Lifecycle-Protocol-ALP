export function alloc(length: number): Uint8Array {
  return new Uint8Array(length);
}

export function from(arrayBuffer: ArrayLike<number>): Uint8Array {
  return Uint8Array.from(arrayBuffer);
}

export function fromString(input: string, _encoding: string): Uint8Array {
  const textEncoder = new TextEncoder();
  return textEncoder.encode(input);
}

export function toString(buffer: Uint8Array, _encoding: string): string {
  const textDecoder = new TextDecoder();
  return textDecoder.decode(buffer);
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

export default {
  alloc,
  from,
  fromString,
  toString,
  concat,
};
