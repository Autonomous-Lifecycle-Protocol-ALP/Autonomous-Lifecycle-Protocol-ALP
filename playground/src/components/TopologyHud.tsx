import { FiTrendingUp, FiX, FiActivity } from 'react-icons/fi';

interface TopologyHudProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: {
    maxDepth: number;
    maxParallel: number;
    criticalPath: string[];
    bottlenecks: { id: string; type: string; score: number }[];
  };
  showCriticalPath: boolean;
  onToggleCriticalPath: () => void;
}

export function TopologyHud({
  isOpen,
  onClose,
  metrics,
  showCriticalPath,
  onToggleCriticalPath,
}: TopologyHudProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FiTrendingUp size={16} color="var(--accent-cyan)" /> Topology &amp; Critical Path Analytics</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="topology-hud-grid">
            <div className="hud-stat-box">
              <span className="hud-stat-title">DAG Max Depth</span>
              <span className="hud-stat-value">{metrics.maxDepth}</span>
              <span className="hud-stat-desc">Sequential execution levels</span>
            </div>
            <div className="hud-stat-box">
              <span className="hud-stat-title">Max Concurrency</span>
              <span className="hud-stat-value">{metrics.maxParallel}</span>
              <span className="hud-stat-desc">Peak parallel agent tasks</span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="form-label">Critical Path ({metrics.criticalPath.length} nodes)</label>
            <div style={{ background: 'var(--bg-dark)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#f59e0b' }}>
              {metrics.criticalPath.length > 0 ? metrics.criticalPath.join(' ➔ ') : 'None'}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="form-label">High-Impact Bottleneck Nodes</label>
            <div className="bottleneck-list">
              {metrics.bottlenecks.map((b) => (
                <div key={b.id} className="bottleneck-item">
                  <span>@{b.type} · <strong>{b.id}</strong></span>
                  <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{b.score} dependencies</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            className={`action-btn ${showCriticalPath ? 'active' : ''}`}
            onClick={onToggleCriticalPath}
          >
            <FiActivity size={13} /> {showCriticalPath ? 'Hide on Graph' : 'Highlight on Graph'}
          </button>
          <button className="action-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
