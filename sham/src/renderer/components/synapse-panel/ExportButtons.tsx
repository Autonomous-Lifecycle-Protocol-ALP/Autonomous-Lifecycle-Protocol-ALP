import React from 'react';
import { Icon } from '../Icon.js';
import { COLORS } from './shared.js';

interface ExportButtonsProps {
  onExportVault: () => void;
  onDownloadCanvas: () => void;
  onCopyMermaid: () => void;
}

export function ExportButtons({
  onExportVault,
  onDownloadCanvas,
  onCopyMermaid,
}: ExportButtonsProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={onExportVault}
        title="Export full Synapse Markdown vault with [[wikilinks]]"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: COLORS.blue,
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Icon name="fileText" size={13} /> Export Vault
      </button>
      <button
        onClick={onDownloadCanvas}
        title="Download interactive JSON Canvas file"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: COLORS.greenBg,
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Icon name="palette" size={13} /> .canvas
      </button>
      <button
        onClick={onCopyMermaid}
        title="Copy Mermaid diagram"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: COLORS.bgHeader,
          color: COLORS.text,
          border: `1px solid ${COLORS.borderLight}`,
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        <Icon name="share2" size={13} /> Mermaid
      </button>
    </div>
  );
}