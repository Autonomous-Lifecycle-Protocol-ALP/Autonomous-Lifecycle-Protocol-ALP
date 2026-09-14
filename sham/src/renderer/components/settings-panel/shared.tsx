import React from 'react';

export type SettingsCategory = 'general' | 'swarm' | 'security';

export const CATEGORIES: SettingsCategory[] = ['general', 'swarm', 'security'];

export const CATEGORY_LABELS: Record<SettingsCategory, string> = {
  general: 'General',
  swarm: 'Swarm',
  security: 'Security',
};

export const THEME_OPTIONS: { value: string; label: string }[] = [
  { value: 'catppuccin', label: 'Catppuccin (Default)' },
  { value: 'dark-plus', label: 'Dark+' },
  { value: 'light-plus', label: 'Light+' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'github-dark', label: 'GitHub Dark' },
];

export const TAB_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 2, label: '2' },
  { value: 4, label: '4' },
  { value: 8, label: '8' },
];

export const RUNTIME_OPTIONS: { value: string; label: string }[] = [
  { value: 'local', label: 'Local (Docker)' },
  { value: 'remote', label: 'Remote (SSH)' },
  { value: 'cloud', label: 'Cloud (ALP Cloud)' },
];

export const LABEL_STYLE: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
};

export const MUTED_STYLE: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-muted)',
};

export const FIELD_LABEL_STYLE: React.CSSProperties = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 4,
};

export const ABOUT_TEXT_STYLE: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
};

export interface ToggleSettingProps {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

export function ToggleSetting({ label, value, onChange }: ToggleSettingProps): React.JSX.Element {
  return (
    <div className="form-row-inline">
      <label style={LABEL_STYLE}>{label}</label>
      <button
        className={`btn btn-sm ${value ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onChange(!value)}
      >
        {value ? 'On' : 'Off'}
      </button>
    </div>
  );
}
