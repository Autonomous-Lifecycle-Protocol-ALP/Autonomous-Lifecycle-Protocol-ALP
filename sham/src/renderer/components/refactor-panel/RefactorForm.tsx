import React from 'react';
import type { RefactorRename } from '../../shared/types.js';

interface RefactorFormProps {
  filePath: string;
  symbolName: string;
  newName: string;
  loading: boolean;
  symbolKind: RefactorRename['kind'];
  onFilePathChange: (value: string) => void;
  onSymbolNameChange: (value: string) => void;
  onNewNameChange: (value: string) => void;
  onSymbolKindChange: (value: RefactorRename['kind']) => void;
  onPreview: () => void;
  onRename: () => void;
}

export function RefactorForm({
  filePath,
  symbolName,
  newName,
  loading,
  symbolKind,
  onFilePathChange,
  onSymbolNameChange,
  onNewNameChange,
  onSymbolKindChange,
  onPreview,
  onRename,
}: RefactorFormProps): React.JSX.Element {
  const isDisabled = loading || !filePath || !symbolName.trim() || !newName.trim();
  const opacity = isDisabled ? 0.6 : 1;

  return (
    <div style={{ marginBottom: 12 }}>
      <div className="panel-title" style={{ padding: 0, marginBottom: 8 }}>Refactor</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={filePath}
          onChange={(e) => onFilePathChange(e.target.value)}
          placeholder="Workspace file path"
          className="input-field"
          style={{ flex: 1, minWidth: 160 }}
        />
        <select
          value={symbolKind}
          onChange={(e) => onSymbolKindChange(e.target.value as RefactorRename['kind'])}
          className="input-field"
          style={{ width: 120 }}
        >
          <option value="agent">Agent</option>
          <option value="skill">Skill</option>
          <option value="macro">Macro</option>
          <option value="event">Event</option>
          <option value="memory">Memory</option>
          <option value="contract">Contract</option>
          <option value="vault">Vault</option>
          <option value="swarm">Swarm</option>
          <option value="workflow">Workflow</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <input
          value={symbolName}
          onChange={(e) => onSymbolNameChange(e.target.value)}
          placeholder="Symbol to rename"
          className="input-field"
          style={{ flex: 1, minWidth: 120 }}
        />
        <input
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
          placeholder="New name"
          className="input-field"
          style={{ flex: 1, minWidth: 120 }}
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={onPreview}
          disabled={isDisabled}
          style={{ opacity }}
        >
          Preview
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onRename}
          disabled={isDisabled}
          style={{ opacity }}
        >
          Rename
        </button>
      </div>
    </div>
  );
}
