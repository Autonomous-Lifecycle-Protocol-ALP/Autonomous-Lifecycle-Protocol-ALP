export function createHash(algorithm?: string) {
  let buffer = '';
  return {
    update(data: string | Uint8Array) {
      if (typeof data === 'string') {
        buffer += data;
      } else {
        buffer += Array.from(data).map((b) => String.fromCharCode(b)).join('');
      }
      return this;
    },
    digest(encoding?: string) {
      let h1 = 0xdeadbeef ^ 0;
      let h2 = 0x41c64e6d ^ 0;
      for (let i = 0; i < buffer.length; i++) {
        const ch = buffer.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
      const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
      const full = (hex1 + hex2).repeat(4);
      return encoding === 'hex' ? full : full;
    },
  };
}

export function randomBytes(size: number): Uint8Array {
  const arr = new Uint8Array(size);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < size; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return arr;
}

export function randomUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const cryptoShim = {
  createHash,
  randomBytes,
  randomUUID,
};

export default cryptoShim;