export function requireChildProcess(): void {
  try {
    require('child_process');
  } catch {
    throw new Error('This operation requires Node.js child_process. Use in Node.js environment only.');
  }
}
