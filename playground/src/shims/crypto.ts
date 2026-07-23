// Browser shim for Node's `crypto` used by ALPEL `crypto.*` expressions and
// parser vault operations. Caveat: this is a playground-only stub.
// SHA-256 returns a stable deterministic hex digest; other operations return
// empty strings so the UI doesn't crash.

function stableHex(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  const s = Math.abs(h).toString(16).padStart(8, '0');
  return (s + s).repeat(4).slice(0, 64);
}

export function createHash(_algorithm: string): { update(data: string): { digest(_encoding: string): string }; digest(_encoding: string): string } {
  let buffer = '';
  return {
    update(data: string) {
      buffer += data;
      return this;
    },
    digest(_encoding: string): string {
      return stableHex(buffer);
    },
  };
}

export function createHmac(_algorithm: string, _key: string): { update(data: string): { digest(_encoding: string): string }; digest(_encoding: string): string } {
  let buffer = '';
  return {
    update(data: string) {
      buffer += data;
      return this;
    },
    digest(_encoding: string): string {
      return stableHex(buffer + _key);
    },
  };
}

export function createDecipheriv(_algorithm: string, _key: string, _iv: string): { update(data: string, encoding: string): { final(encoding: string): string }; final(encoding: string): string } {
  return {
    update(_data: string, _encoding: string) {
      return this;
    },
    final(_encoding: string): string {
      return '';
    },
  };
}

export function generateKeyPairSync(_algorithm: string): { publicKey: { export(options: unknown): ArrayBuffer }; privateKey: { export(options: unknown): ArrayBuffer } } {
  const encoder = new TextEncoder();
  const dummy = encoder.encode('alp-vault-dummy-key');
  return {
    publicKey: { export: () => dummy.buffer },
    privateKey: { export: () => dummy.buffer },
  };
}

export function diffieHellman(_options: { privateKey: { export(options: unknown): ArrayBuffer }; publicKey: { export(options: unknown): ArrayBuffer } }): { publicKey: { export(options: unknown): ArrayBuffer } } {
  return {
    publicKey: { export: () => new ArrayBuffer(32) },
  };
}

export function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default {
  createHash,
  createHmac,
  createDecipheriv,
  generateKeyPairSync,
  diffieHellman,
  randomUUID,
};
