import React from 'react';
import { Icon } from '../Icon.js';
import { INITIAL_DLQ, s } from './shared.js';

interface EventDetailProps {
  dlqAlerts: typeof INITIAL_DLQ;
  activeTab: string;
}

export const EventDetail: React.FC<EventDetailProps> = ({ dlqAlerts, activeTab }) => {
  if (activeTab !== 'dlq') return null;

  return (
    <div>
      {dlqAlerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="check" size={32} color="var(--accent-green)" /></div>
          <div className="empty-state-title">No dead-letter queue alerts</div>
          <div className="empty-state-desc">All messages are being delivered successfully.</div>
        </div>
      ) : (
        dlqAlerts.map(a => (
          <div key={a.id} className="alert-card card">
            <span style={{ fontSize: 'var(--font-size-md)', marginTop: 2 }}><Icon name="alertTriangle" size={16} color="var(--accent-yellow)" /></span>
            <div style={{ flex: 1 }}>
              <div className="flex-between">
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--accent-red)' }}>{a.id}</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{a.time}</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', marginTop: 4 }}>{a.reason}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-blue)', marginTop: 4, fontFamily: 'monospace' }}>topic: {a.topic}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
