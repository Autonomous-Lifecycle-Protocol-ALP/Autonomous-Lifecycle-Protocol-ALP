import React from 'react';
import { CATEGORIES, CATEGORY_LABELS, SettingsCategory } from './shared.js';

interface SettingsNavProps {
  active: SettingsCategory;
  onChange: (category: SettingsCategory) => void;
}

export function SettingsNav({ active, onChange }: SettingsNavProps): React.JSX.Element {
  return (
    <div className="settings-nav" style={{ display: 'flex', gap: 'var(--spacing-xs)', padding: 'var(--spacing-sm) 0' }}>
      {CATEGORIES.map((category) => (
        <button
          key={category}
          className={`btn btn-sm ${active === category ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onChange(category)}
        >
          {CATEGORY_LABELS[category]}
        </button>
      ))}
    </div>
  );
}
