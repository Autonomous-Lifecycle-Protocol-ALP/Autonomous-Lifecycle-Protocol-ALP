import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';

export interface MultiModalModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedObjects: AlpObject[];
}

export interface ActionTestResult {
  allowed: boolean;
  reason?: string;
  timestamp?: string;
  blockedActions?: string[];
}

export const COLORS = {
  bg: '#131b2e',
  bgDarker: '#0b0f19',
  border: 'rgba(255,255,255,0.08)',
  borderCyan: 'rgba(0, 240, 255, 0.2)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  cyan: '#38bdf8',
  cyanBright: '#00f0ff',
  purple: '#c084fc',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
} as const;

export const cardStyle: React.CSSProperties = {
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
};

export const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  fontSize: 10,
  padding: '2px 8px',
  borderRadius: 12,
  background: bg,
  color,
});
