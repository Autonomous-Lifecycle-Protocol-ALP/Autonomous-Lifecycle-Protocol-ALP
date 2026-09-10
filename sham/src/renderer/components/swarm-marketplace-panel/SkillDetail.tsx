import React from 'react';
import { Icon } from '../Icon.js';

interface SkillDetailProps {
  invocationLog: string[];
}

export const SkillDetail: React.FC<SkillDetailProps> = ({ invocationLog }) => {
  if (invocationLog.length === 0) return null;

  return (
    <div className="card">
      <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-blue)' }}><Icon name="zap" size={16} /> Live Invocation Telemetry</h4>
      <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', maxHeight: 'clamp(80px, 15vh, 120px)', overflowY: 'auto' }}>
        {invocationLog.map((log, index) => (
          <div key={index} style={{ padding: '2px 0', color: 'var(--accent-green)' }}>{log}</div>
        ))}
      </div>
    </div>
  );
};
