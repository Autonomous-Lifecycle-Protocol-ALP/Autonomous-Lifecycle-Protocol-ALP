import React from 'react';

/* ── Types ─────────────────────────────────────────────────────────────── */

export type SafetyLevel = 'low' | 'medium' | 'high' | 'critical';
export type Tab = 'overview' | 'assets' | 'actions' | 'simulator';

/* ── Color Maps ────────────────────────────────────────────────────────── */

export const SAFETY_COLORS: Record<SafetyLevel, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export const MODALITY_ICONS: Record<string, string> = {
  vision: '👁️',
  audio: '🎵',
  sensor: '📡',
  text: '📝',
  spatial: '🌐',
};

export const ASSET_TYPE_COLORS: Record<string, string> = {
  image: '#8b5cf6',
  video: '#3b82f6',
  audio: '#10b981',
  sensor: '#f59e0b',
  point_cloud: '#06b6d4',
  spatial: '#ec4899',
};

/* ── Styles ─�───────────────────────────────────────────────────────────── */

export const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#0e1117',
  color: '#e6edf3',
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  overflow: 'hidden',
};

export const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  borderBottom: '1px solid #21262d',
  background: 'linear-gradient(135deg, #161b22 0%, #0e1117 100%)',
};

export const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid #21262d',
  background: '#161b22',
};

export const cardStyle: React.CSSProperties = {
  background: '#161b22',
  borderRadius: 10,
  border: '1px solid #21262d',
  padding: '14px 16px',
  marginBottom: 10,
  transition: 'border-color 0.2s',
};

export const chipStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 10px',
  borderRadius: 9999,
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: color + '1a',
  color,
  border: `1px solid ${color}44`,
});

/* ── Shared Components ─────────────────────────────────────────────────── */

export function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        border: 'none',
        borderBottom: active ? '2px solid #8b5cf6' : '2px solid transparent',
        background: 'transparent',
        color: active ? '#e6edf3' : '#8b949e',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

export function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: `${color}0d`,
        border: `1px solid ${color}33`,
        borderRadius: 10,
        padding: '14px 14px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#8b949e', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 6,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>{title}</span>
      {count > 0 && (
        <span style={{ fontSize: 10, color: '#8b949e', background: '#21262d', padding: '2px 8px', borderRadius: 9999 }}>
          {count}
        </span>
      )}
    </div>
  );
}

export function TokenBudgetBar({ percent }: { percent: number }) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const barColor =
    clampedPercent > 90 ? '#ef4444' : clampedPercent > 70 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          width: '100%',
          height: 6,
          backgroundColor: '#21262d',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedPercent}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: '#8b949e', marginTop: 2, textAlign: 'right' }}>
        {clampedPercent.toFixed(0)}% context budget
      </div>
    </div>
  );
}
