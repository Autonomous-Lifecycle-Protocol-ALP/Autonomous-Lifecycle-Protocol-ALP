import { FiLayers, FiPlay, FiActivity } from 'react-icons/fi';
import type { ReactNode } from 'react';
import type { FeatureTab } from './shared.js';

export interface AppTabsProps {
  value: FeatureTab;
  onChange: (value: FeatureTab) => void;
}

const TABS: { id: FeatureTab; label: string; icon: ReactNode }[] = [
  { id: 'graph', label: 'Graph View', icon: <FiLayers size={12} /> },
  { id: 'simulation', label: 'Simulation', icon: <FiPlay size={12} /> },
  { id: 'analytics', label: 'Analytics', icon: <FiActivity size={12} /> },
];

export function AppTabs({ value, onChange }: AppTabsProps) {
  return (
    <div className="layout-switcher" role="tablist" aria-label="Feature tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          id={`feature-tab-${tab.id}`}
          className={`layout-btn ${value === tab.id ? 'active' : ''}`}
          role="tab"
          aria-selected={value === tab.id}
          aria-controls={`feature-panel-${tab.id}`}
          title={`Switch to ${tab.label} view`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
