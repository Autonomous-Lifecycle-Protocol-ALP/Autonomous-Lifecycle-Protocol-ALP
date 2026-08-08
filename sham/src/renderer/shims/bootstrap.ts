import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    browser: true,
    nextTick: (cb: Function, ...args: any[]) => Promise.resolve(cb(...args)),
  };
}
