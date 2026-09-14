import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { INITIAL_TOPICS, INITIAL_SUBS, statusColor, statusIcon, s } from './shared.js';

interface EventListProps {
  topics: typeof INITIAL_TOPICS;
  subs: typeof INITIAL_SUBS;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const EventList: React.FC<EventListProps> = ({ topics, subs, activeTab, onTabChange }) => {
  return (
    <div style={s.body}>
      {activeTab === 'topics' && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Published</th>
                <th>Delivered</th>
                <th>Failed</th>
                <th>Throughput</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {topics.map(t => {
                const rate = t.published > 0 ? (t.delivered / t.published) * 100 : 100;
                const health = rate >= 99 ? 'HEALTHY' : rate >= 95 ? 'DEGRADED' : 'DEAD';
                return (
                  <tr key={t.topic}>
                    <td style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontWeight: 600 }}>{t.topic}</td>
                    <td>{t.published.toLocaleString()}</td>
                    <td style={{ color: 'var(--accent-green)' }}>{t.delivered.toLocaleString()}</td>
                    <td style={{ color: t.failed > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{t.failed}</td>
                    <td style={{ color: 'var(--accent)' }}>{t.throughput} msg/s</td>
                    <td><span className="badge badge-responsive" style={{ background: statusColor(health) + '18', color: statusColor(health), border: '1px solid ' + statusColor(health) + '33' }}>{statusIcon(health)} {health}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Subscription</th>
                <th>Topic</th>
                <th>Consumer</th>
                <th>Status</th>
                <th>Unacked</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{sub.id}</td>
                  <td style={{ color: 'var(--accent-blue)' }}>{sub.topic}</td>
                  <td>{sub.consumer}</td>
                  <td><span className="badge badge-responsive" style={{ background: statusColor(sub.status) + '18', color: statusColor(sub.status), border: '1px solid ' + statusColor(sub.status) + '33' }}>{statusIcon(sub.status)} {sub.status}</span></td>
                  <td style={{ color: sub.unacked > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>{sub.unacked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
