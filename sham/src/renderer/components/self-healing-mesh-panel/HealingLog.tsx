import React from 'react';
import { Icon } from '../Icon.js';
import { activePlan, failures, generateSelfHealingPlan } from './shared.js';

interface HealingLogProps {
  onGeneratePlan: () => void;
}

export const HealingLog: React.FC<HealingLogProps> = ({ onGeneratePlan }) => {
  return (
    <div className="section-card">
      <div className="flex-between" style={{ marginBottom: '12px' }}>
        <h3 className="section-card-title"><Icon name="heart" size={16} /> Automated Healing Plan & Task Reroutes</h3>
        <button
          onClick={onGeneratePlan}
          className="btn btn-lg"
          style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))', color: 'var(--bg-primary)', fontWeight: 700 }}
        >
          <Icon name="zap" size={16} /> Synthesize Healing Plan
        </button>
      </div>
      {activePlan ? (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '12px' }}>
            Plan ID: <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{activePlan.planId}</span>
          </div>
          <div className="card-container">
            {activePlan.taskReroutes.map((r, i) => (
              <div key={i} className="card">
                <div style={{ fontWeight: 600, color: 'var(--accent-yellow)', fontSize: 'var(--font-size-sm)' }}>{r.taskId}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                  <span style={{ color: 'var(--accent-red)' }}>{r.fromNode}</span> → <span style={{ color: 'var(--accent-green)' }}>{r.toNode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="heart" size={32} color="var(--text-muted)" /></div>
          <div className="empty-state-title">No healing plan</div>
          <div className="empty-state-desc">
            {failures.length > 0 ? `${failures.length} degraded/failed node(s) detected. Click 'Synthesize Healing Plan' to failover.` : 'All swarm nodes healthy. No healing plan needed.'}
          </div>
        </div>
      )}
    </div>
  );
};
