import type { ProfileTrace } from '../../shared/types.js';

export type FeedbackType = 'success' | 'error';

export interface Feedback {
  type: FeedbackType;
  message: string;
}

export function formatTraceLabel(trace: ProfileTrace): string {
  if (trace.agentId) return `Agent: ${trace.agentId}`;
  if (trace.command) return `Command: ${trace.command}`;
  return 'Manual trace';
}

export function formatDuration(trace: ProfileTrace): string {
  if (trace.durationMs === undefined) return '';
  return ` · ${trace.durationMs}ms`;
}

export function formatStartedAt(trace: ProfileTrace): string {
  return `Started: ${new Date(trace.startedAt).toLocaleTimeString()}`;
}

export function formatFinishedAt(trace: ProfileTrace): string {
  if (!trace.finishedAt) return '';
  return ` · Finished: ${new Date(trace.finishedAt).toLocaleTimeString()}`;
}

export const feedbackStyle = (type: FeedbackType) => ({
  padding: '6px 10px',
  borderRadius: 4,
  fontSize: 12,
  marginBottom: 8,
  backgroundColor: type === 'success' ? 'rgba(166, 227, 161, 0.1)' : 'rgba(243, 139, 168, 0.1)',
  color: type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
  border: `1px solid ${type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
});