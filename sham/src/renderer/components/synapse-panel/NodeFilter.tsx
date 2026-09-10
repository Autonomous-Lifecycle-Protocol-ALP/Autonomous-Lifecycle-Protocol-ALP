import React from 'react';
import { COLORS } from './shared.js';

const NODE_TYPES = ['all', 'task', 'agent', 'policy', 'contract', 'workflow', 'vault'];

interface NodeFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function NodeFilter({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
}: NodeFilterProps): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: COLORS.bg,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flex: 1,
          maxWidth: '280px',
          position: 'relative',
        }}
      >
        <input
          type="text"
          placeholder="Search nodes, wikilinks, tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            background: COLORS.bgHeader,
            border: `1px solid ${COLORS.borderLight}`,
            borderRadius: '6px',
            padding: '6px 10px',
            color: COLORS.text,
            fontSize: '12px',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'transparent',
              border: 'none',
              color: COLORS.textMuted,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
        <span style={{ color: COLORS.textMuted }}>Filter Type:</span>
        {NODE_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            style={{
              background: selectedType === t ? COLORS.borderLight : 'transparent',
              color: selectedType === t ? COLORS.textBright : COLORS.textMuted,
              border: '1px solid',
              borderColor: selectedType === t ? COLORS.textMuted : COLORS.border,
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}