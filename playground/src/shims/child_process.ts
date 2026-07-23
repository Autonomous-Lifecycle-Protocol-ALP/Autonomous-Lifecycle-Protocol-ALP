// Browser shim for Node's `child_process`.
// The playground never executes shell commands; this stub exists solely
// to keep the ALP parser bundle browser-compatible.

export function execFileSync(_command: string, _args: string[], _options?: unknown): string {
  throw new Error('child_process.execFileSync is not available in the browser');
}

export function execSync(_command: string, _options?: unknown): string {
  throw new Error('child_process.execSync is not available in the browser');
}

export function spawnSync(_command: string, _args: string[], _options?: unknown): unknown {
  throw new Error('child_process.spawnSync is not available in the browser');
}

export default {
  execFileSync,
  execSync,
  spawnSync,
};
