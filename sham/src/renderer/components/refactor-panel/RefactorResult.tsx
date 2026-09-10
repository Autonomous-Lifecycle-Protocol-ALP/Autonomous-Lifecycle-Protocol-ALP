import React from 'react';
import { Icon } from '../Icon.js';
import type { RefactorRename } from '../../shared/types.js';

interface RefactorResultProps {
  renames: RefactorRename[];
  output: string[];
  loading: boolean;
}

export function RefactorResult({
  renames,
  output,
  loading,
}: RefactorResultProps): React.JSX.Element {
  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renames.length === 0 ? (
          <div className="empty-state" style={{ height: 'auto', padding: 24 }}>
            <div className="empty-state-icon"><Icon name="code" size={32} color="var(--text-muted)" /></div>
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
    </>
  );
}
