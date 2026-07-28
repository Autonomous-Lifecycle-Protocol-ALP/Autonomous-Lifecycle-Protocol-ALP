import React, { useState, useEffect } from 'react';
import {
  refactorFindSymbols,
  refactorRename,
  refactorPreview,
} from '../shared/alp-client.js';
import type { RefactorRename } from '../shared/types.js';

interface RefactorPanelProps {
  renames: RefactorRename[];
  output: string[];
  onUpdateRenames: (renames: RefactorRename[]) => void;
  onAppendOutput: (lines: string[]) => void;
}

export function RefactorPanel({
  renames,
  output,
  onUpdateRenames,
  onAppendOutput,
}: RefactorPanelProps): React.JSX.Element {
  const [filePath, setFilePath] = useState('');
  const [symbolName, setSymbolName] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [symbolKind, setSymbolKind] = useState<RefactorRename['kind']>('agent');

  useEffect(() => {
    if (filePath) {
      setLoading(true);
      refactorFindSymbols({ filePath }).then((result) => {
        if (result.success) {
          onUpdateRenames(result.renames);
        }
        setLoading(false);
      });
    }
  }, [filePath]);

  const handlePreview = async () => {
    if (!filePath || !symbolName.trim() || !newName.trim()) return;
    setLoading(true);
    const result = await refactorPreview({
      filePath,
      oldName: symbolName.trim(),
      newName: newName.trim(),
      kind: symbolKind,
    });
    if (result.success) {
      onUpdateRenames(result.renames);
      onAppendOutput([`[REFACTOR] Preview ready: ${result.renames.length} rename(s)`]);
    } else {
      onAppendOutput([`[REFACTOR] Preview failed: ${result.error}`]);
    }
    setLoading(false);
  };

  const handleRename = async () => {
    if (!filePath || !symbolName.trim() || !newName.trim()) return;
    setLoading(true);
    const result = await refactorRename({
      filePath,
      oldName: symbolName.trim(),
      newName: newName.trim(),
      kind: symbolKind,
    });
    if (result.success) {
      onAppendOutput([`[REFACTOR] Renamed ${symbolName.trim()} -> ${newName.trim()} across ${result.renames.length} file(s)`]);
      onUpdateRenames(result.renames);
      setSymbolName('');
      setNewName('');
    } else {
      onAppendOutput([`[REFACTOR] Rename failed: ${result.error}`]);
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <div className="panel-title" style={{ padding: 0, marginBottom: 8 }}>Refactor</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Workspace file path"
            className="input-field"
            style={{ flex: 1, minWidth: 160 }}
          />
          <select
            value={symbolKind}
            onChange={(e) => setSymbolKind(e.target.value as RefactorRename['kind'])}
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
            onChange={(e) => setSymbolName(e.target.value)}
            placeholder="Symbol to rename"
            className="input-field"
            style={{ flex: 1, minWidth: 120 }}
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New name"
            className="input-field"
            style={{ flex: 1, minWidth: 120 }}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={handlePreview}
            disabled={loading || !filePath || !symbolName.trim() || !newName.trim()}
            style={{ opacity: loading || !filePath || !symbolName.trim() || !newName.trim() ? 0.6 : 1 }}
          >
            Preview
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleRename}
            disabled={loading || !filePath || !symbolName.trim() || !newName.trim()}
            style={{ opacity: loading || !filePath || !symbolName.trim() || !newName.trim() ? 0.6 : 1 }}
          >
            Rename
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renames.length === 0 ? (
          <div className="empty-state" style={{ height: 'auto', padding: 24 }}>
            <div className="empty-state-icon">&#10070;</div>
            <div className="empty-state-title">{loading ? 'Scanning workspace...' : 'No renames yet'}</div>
            <div className="empty-state-desc">{loading ? '' : 'Enter a workspace path to discover symbols, or run a rename preview.'}</div>
          </div>
        ) : (
          renames.map((rename) => (
            <div
              key={rename.id}
              className="section-card"
              style={{ marginBottom: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {rename.oldName} → {rename.newName}
                </div>
                <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>
                  {rename.kind}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {rename.occurrences} occurrence(s) across {rename.files.length} file(s)
              </div>
              {rename.files.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Files: {rename.files.join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Refactor Log</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)', padding: 8 }}>
          {output.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No refactor activity yet.</div>
          ) : (
            output.map((line, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '1px 0' }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
