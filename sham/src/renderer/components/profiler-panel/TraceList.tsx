import { Icon } from '../Icon.js';
import type { ProfileTrace } from '../../shared/types.js';
import { TraceDetail } from './TraceDetail.js';
import {
  formatTraceLabel,
  formatDuration,
  formatStartedAt,
  formatFinishedAt,
} from './shared.js';

export interface TraceListProps {
  traces: ProfileTrace[];
  loading: boolean;
  onStop: (trace: ProfileTrace, status: 'completed' | 'failed') => void;
}

export function TraceList({
  traces,
  loading,
  onStop,
}: TraceListProps): React.JSX.Element {
  if (traces.length === 0) {
    return (
      <div className="empty-state" style={{ height: 'auto', padding: 24 }}>
        <div className="empty-state-icon"><Icon name="activity" size={32} color="var(--text-muted)" /></div>
        <div className="empty-state-title">No traces recorded yet</div>
        <div className="empty-state-desc">Start a trace to profile agent execution, policy decisions, and memory operations.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {traces.map((trace) => (
        <div
          key={trace.id}
          className="section-card"
          style={{ opacity: trace.status === 'running' ? 1 : 0.85 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{trace.id}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {formatTraceLabel(trace)}{formatDuration(trace)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {formatStartedAt(trace)}{formatFinishedAt(trace)}
              </div>
            </div>
            <span
              className={`badge ${trace.status === 'running' ? 'badge-info' : trace.status === 'completed' ? 'badge-success' : 'badge-error'}`}
            >
              {trace.status}
            </span>
          </div>

          {trace.status === 'running' && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onStop(trace, 'completed')}
                disabled={loading}
              >
                Complete
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onStop(trace, 'failed')}
                disabled={loading}
              >
                Fail
              </button>
            </div>
          )}

          <TraceDetail trace={trace} />
        </div>
      ))}
    </div>
  );
}