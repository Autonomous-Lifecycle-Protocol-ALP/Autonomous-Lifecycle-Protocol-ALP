import { ipcMain } from 'electron';
import type { ProfileTrace } from './types.js';

export function setupProfilerHandlers(profileTraces: ProfileTrace[]) {
  ipcMain.handle('profiler-start', async (_event, payload: { agentId?: string; command?: string }) => {
    const trace: ProfileTrace = {
      id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      agentId: payload.agentId,
      command: payload.command,
      startedAt: new Date().toISOString(),
      status: 'running',
    };
    profileTraces.unshift(trace);
    return { success: true, trace };
  });

  ipcMain.handle('profiler-stop', async (_event, { traceId, status, stdout, stderr, error }: { traceId: string; status: 'completed' | 'failed'; stdout?: string; stderr?: string; error?: string }) => {
    const trace = profileTraces.find((t) => t.id === traceId);
    if (!trace) {
      return { success: false, error: `Trace ${traceId} not found` };
    }
    trace.status = status;
    trace.finishedAt = new Date().toISOString();
    trace.durationMs = new Date(trace.finishedAt).getTime() - new Date(trace.startedAt).getTime();
    if (stdout !== undefined) trace.stdout = stdout;
    if (stderr !== undefined) trace.stderr = stderr;
    if (error !== undefined) trace.error = error;
    return { success: true, trace };
  });

  ipcMain.handle('profiler-list', async () => {
    return { success: true, traces: [...profileTraces] };
  });

  ipcMain.handle('profiler-clear', async () => {
    profileTraces.length = 0;
    return { success: true };
  });
}
