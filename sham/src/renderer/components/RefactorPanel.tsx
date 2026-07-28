import React, { useState, useEffect } from 'react';
import { theme } from '../styles/theme.js';
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
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Refactor</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Workspace file path"
            style={{ flex: 1, minWidth: 160, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }}
          />
          <select
            value={symbolKind}
            onChange={(e) => setSymbolKind(e.target.value as RefactorRename['kind'])}
            style={{ background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }}
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
            style={{ flex: 1, minWidth: 120, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }}
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New name"
            style={{ flex: 1, minWidth: 120, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }}
          />
          <button
            onClick={handlePreview}
            disabled={loading || !filePath || !symbolName.trim() || !newName.trim()}
            style={{ padding: '6px 14px', background: theme.bgHover, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: 4, cursor: loading || !filePath || !symbolName.trim() || !newName.trim() ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading || !filePath || !symbolName.trim() || !newName.trim() ? 0.6 : 1 }}
          >
            Preview
          </button>
          <button
            onClick={handleRename}
            disabled={loading || !filePath || !symbolName.trim() || !newName.trim()}
            style={{ padding: '6px 14px', background: theme.accent, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading || !filePath || !symbolName.trim() || !newName.trim() ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading || !filePath || !symbolName.trim() || !newName.trim() ? 0.6 : 1 }}
          >
            Rename
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renames.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: 24 }}>
            {loading ? 'Scanning workspace...' : 'Enter a workspace path to discover symbols, or run a rename preview.'}
          </div>
        ) : (
          renames.map((rename) => (
            <div
              key={rename.id}
              style={{
                padding: 10,
                marginBottom: 8,
                background: theme.bgSurface,
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: theme.textPrimary }}>
                  {rename.oldName} → {rename.newName}
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: theme.bgHover, color: theme.textMuted, textTransform: 'capitalize' }}>
                  {rename.kind}
                </span>
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                {rename.occurrences} occurrence(s) across {rename.files.length} file(s)
              </div>
              {rename.files.length > 0 && (
                <div style={{ fontSize: 11, color: theme.textMuted }}>
                  Files: {rename.files.join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Refactor Log</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: theme.bgSecondary, borderRadius: 6, border: `1px solid ${theme.border}`, padding: 8 }}>
          {output.length === 0 ? (
            <div style={{ color: theme.textMuted, fontSize: 12 }}>No refactor activity yet.</div>
          ) : (
            output.map((line, i) => (
              <div key={i} style={{ fontSize: 12, color: theme.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '1px 0' }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
