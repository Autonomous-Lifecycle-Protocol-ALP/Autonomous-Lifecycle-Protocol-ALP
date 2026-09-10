import type { ProfileTrace } from '../../shared/types.js';

export interface TraceDetailProps {
  trace: ProfileTrace;
}

export function TraceDetail({ trace }: TraceDetailProps): React.JSX.Element | null {
  if (!trace.stdout && !trace.stderr && !trace.error) {
    return null;
  }

  return (
    <div style={{ marginTop: 8, background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border)', padding: 8 }}>
      {trace.stdout && (
        <div style={{ fontSize: 11, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{trace.stdout}</div>
      )}
      {trace.stderr && (
        <div style={{ fontSize: 11, color: 'var(--accent-yellow)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{trace.stderr}</div>
      )}
      {trace.error && (
        <div style={{ fontSize: 11, color: 'var(--accent-red)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>Error: {trace.error}</div>
      )}
    </div>
  );
}