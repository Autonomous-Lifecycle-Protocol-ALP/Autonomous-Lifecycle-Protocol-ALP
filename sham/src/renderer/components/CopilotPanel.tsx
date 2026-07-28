import React, { useState, useEffect } from 'react';
import { theme } from '../styles/theme.js';
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
      onAppendOutput([`[COPLILOT] Applied fix: ${suggestion.message}`]);
    } else {
      onAppendOutput([`[COPLILOT] Failed to apply fix: ${result.error}`]);
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
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>ALP Copilot</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Active file path"
            style={{ flex: 1, minWidth: 160, background: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: '6px 10px', borderRadius: 4, fontSize: 12, outline: 'none' }}
          />
          <button
            onClick={handleRefresh}
            disabled={loading || !filePath}
            style={{ padding: '6px 14px', background: theme.accent, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading || !filePath ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: loading || !filePath ? 0.6 : 1 }}
          >
            Refresh
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {(['all', 'fix', 'completion', 'tip'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ padding: '4px 10px', background: filter === f ? theme.bgSurface : 'transparent', border: `1px solid ${theme.border}`, color: filter === f ? theme.textPrimary : theme.textMuted, borderRadius: 4, cursor: 'pointer', fontSize: 11, textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: 24 }}>
            {loading ? 'Analyzing document...' : 'Open an ALP file to see copilot suggestions.'}
          </div>
        ) : (
          filtered.map((suggestion) => (
            <div
              key={suggestion.id}
              style={{
                padding: 10,
                marginBottom: 8,
                background: theme.bgSurface,
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 10,
                    backgroundColor:
                      suggestion.type === 'fix'
                        ? '#3a1a1a'
                        : suggestion.type === 'completion'
                          ? '#1a1a3a'
                          : '#1a3a2a',
                    color:
                      suggestion.type === 'fix'
                        ? theme.accentRed
                        : suggestion.type === 'completion'
                          ? theme.accent
                          : theme.accentGreen,
                    textTransform: 'capitalize',
                  }}
                >
                  {suggestion.type}
                </span>
                {suggestion.severity && (
                  <span style={{ fontSize: 11, color: theme.textMuted, textTransform: 'capitalize' }}>{suggestion.severity}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: theme.textPrimary, marginBottom: 4 }}>{suggestion.message}</div>
              {suggestion.diagnostic && (
                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                  Line {suggestion.diagnostic.line}:{suggestion.diagnostic.column} — {suggestion.diagnostic.message}
                </div>
              )}
              {suggestion.insertText && (
                <div style={{ background: theme.bgSecondary, borderRadius: 4, border: `1px solid ${theme.border}`, padding: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Suggested change:</div>
                  <pre style={{ margin: 0, fontSize: 12, color: theme.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{suggestion.insertText}</pre>
                </div>
              )}
              {suggestion.insertText && (
                <button
                  onClick={() => handleApplyFix(suggestion)}
                  disabled={loading}
                  style={{ padding: '4px 10px', background: theme.accentGreen, border: 'none', color: theme.bgPrimary, borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
                >
                  Apply Fix
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Copilot Log</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: theme.bgSecondary, borderRadius: 6, border: `1px solid ${theme.border}`, padding: 8 }}>
          {output.length === 0 ? (
            <div style={{ color: theme.textMuted, fontSize: 12 }}>No copilot activity yet.</div>
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
