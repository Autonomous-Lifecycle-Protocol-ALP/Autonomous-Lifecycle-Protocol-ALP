import React, { useState, useEffect } from 'react';
import {
  copilotSuggest,
  copilotApplyFix,
} from '../shared/alp-client.js';
import type { CopilotSuggestion, ALPDiagnostic } from '../shared/types.js';

interface CopilotPanelProps {
  suggestions: CopilotSuggestion[];
  output: string[];
  diagnostics: ALPDiagnostic[];
  onUpdateSuggestions: (suggestions: CopilotSuggestion[]) => void;
  onAppendOutput: (lines: string[]) => void;
}

export function CopilotPanel({
  suggestions,
  output,
  diagnostics,
  onUpdateSuggestions,
  onAppendOutput,
}: CopilotPanelProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'fix' | 'completion' | 'tip'>('all');

  useEffect(() => {
    if (filePath) {
      setLoading(true);
      copilotSuggest({ content, filePath }).then((result) => {
        if (result.success) {
          onUpdateSuggestions(result.suggestions);
        }
        setLoading(false);
      });
    }
  }, [content, filePath]);

  const filtered = filter === 'all' ? suggestions : suggestions.filter((s) => s.type === filter);

  const handleApplyFix = async (suggestion: CopilotSuggestion) => {
    setLoading(true);
    const result = await copilotApplyFix({
      filePath,
      suggestionId: suggestion.id,
      insertText: suggestion.insertText,
      range: suggestion.range,
    });
    if (result.success) {
      onAppendOutput([`[COPILOT] Applied fix: ${suggestion.message}`]);
    } else {
      onAppendOutput([`[COPILOT] Failed to apply fix: ${result.error}`]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (!filePath) return;
    setLoading(true);
    const result = await copilotSuggest({ content, filePath });
    if (result.success) {
      onUpdateSuggestions(result.suggestions);
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <div className="panel-title" style={{ padding: 0, marginBottom: 8 }}>ALP Copilot</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Active file path"
            className="input-field"
            style={{ flex: 1, minWidth: 160 }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleRefresh}
            disabled={loading || !filePath}
            style={{ opacity: loading || !filePath ? 0.6 : 1 }}
          >
            Refresh
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {(['all', 'fix', 'completion', 'tip'] as const).map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ height: 'auto', padding: 24 }}>
            <div className="empty-state-icon">&#129302;</div>
            <div className="empty-state-title">{loading ? 'Analyzing document...' : 'No suggestions yet'}</div>
            <div className="empty-state-desc">{loading ? '' : 'Open an ALP file to see copilot suggestions.'}</div>
          </div>
        ) : (
          filtered.map((suggestion) => (
            <div
              key={suggestion.id}
              className="section-card"
              style={{ marginBottom: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span
                  className={`badge ${suggestion.type === 'fix' ? 'badge-error' : suggestion.type === 'completion' ? 'badge-info' : 'badge-success'}`}
                >
                  {suggestion.type}
                </span>
                {suggestion.severity && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{suggestion.severity}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{suggestion.message}</div>
              {suggestion.diagnostic && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Line {suggestion.diagnostic.line}:{suggestion.diagnostic.column} — {suggestion.diagnostic.message}
                </div>
              )}
              {suggestion.insertText && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border)', padding: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Suggested change:</div>
                  <pre style={{ margin: 0, fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>{suggestion.insertText}</pre>
                </div>
              )}
              {suggestion.insertText && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApplyFix(suggestion)}
                  disabled={loading}
                >
                  Apply Fix
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Copilot Log</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)', padding: 8 }}>
          {output.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No copilot activity yet.</div>
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
