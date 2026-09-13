import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    versions: {
      electron: '33.4.11',
      node: '20.0.0',
    },
    browser: true,
    nextTick: (cb: Function, ...args: any[]) => Promise.resolve(cb(...args)),
  } as any;
} else if (!globalThis.process.versions) {
  (globalThis.process as any).versions = {
    electron: '33.4.11',
    node: '20.0.0',
  };
}
