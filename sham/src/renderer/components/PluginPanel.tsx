import React, { useState, useEffect } from 'react';
import { theme } from '../styles/theme.js';
import { listPlugins, togglePlugin, reloadPlugin } from '../shared/alp-client.js';
import type { Plugin } from '../shared/types.js';

interface PluginPanelProps {
  plugins: Plugin[];
  output: string[];
  onUpdatePlugins: (plugins: Plugin[]) => void;
  onAppendOutput: (lines: string[]) => void;
}

export function PluginPanel({ plugins, output, onUpdatePlugins, onAppendOutput }: PluginPanelProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const result = await listPlugins();
    if (result.success) {
      onUpdatePlugins(result.plugins);
    }
  }

  const appendResult = async (result: { success: boolean; message?: string; error?: string }) => {
    if (result.message) {
      onAppendOutput([result.message]);
    }
    if (result.error) {
      setFeedback({ type: 'error', message: result.error });
      onAppendOutput([`Error: ${result.error}`]);
    } else if (result.message) {
      setFeedback({ type: 'success', message: result.message });
    }
  };

  const handleToggle = async (plugin: Plugin) => {
    setLoading(true);
    setFeedback(null);
    const result = await togglePlugin(plugin.manifest.id, !plugin.enabled);
    if (result.success) {
      onUpdatePlugins(result.plugins);
    }
    await appendResult(result);
    setLoading(false);
  };

  const handleReload = async (plugin: Plugin) => {
    setLoading(true);
    setFeedback(null);
    const result = await reloadPlugin(plugin.manifest.id);
    if (result.success) {
      onUpdatePlugins(result.plugins);
    }
    await appendResult(result);
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Plugins</div>
        {feedback && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              marginBottom: 8,
              backgroundColor: feedback.type === 'success' ? '#1a3a2a' : '#3a1a1a',
              color: feedback.type === 'success' ? theme.accentGreen : theme.accentRed,
            }}
          >
            {feedback.message}
          </div>
        )}
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
          {plugins.length} plugin{plugins.length === 1 ? '' : 's'} discovered from the bundled plugins directory.
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {plugins.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: 24 }}>
            No plugins found. Drop plugin folders into the bundled `plugins/` directory to extend SHAM.
          </div>
        ) : (
          plugins.map((plugin) => (
            <div
              key={plugin.manifest.id}
              style={{
                padding: 10,
                marginBottom: 8,
                background: theme.bgSurface,
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                opacity: plugin.enabled ? 1 : 0.7,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: theme.textPrimary }}>{plugin.manifest.name}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    {plugin.manifest.id} · v{plugin.manifest.version}
                  </div>
                  {plugin.manifest.description && (
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>{plugin.manifest.description}</div>
                  )}
                  {plugin.error && (
                    <div style={{ fontSize: 11, color: theme.accentRed, marginTop: 4 }}>Error: {plugin.error}</div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 10,
                    backgroundColor: plugin.enabled ? '#1a3a2a' : '#2a1a1a',
                    color: plugin.enabled ? theme.accentGreen : theme.textMuted,
                  }}
                >
                  {plugin.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleToggle(plugin)}
                  disabled={loading}
                  style={{
                    padding: '4px 10px',
                    background: plugin.enabled ? theme.accentRed : theme.accentGreen,
                    border: 'none',
                    color: theme.bgPrimary,
                    borderRadius: 4,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {plugin.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleReload(plugin)}
                  disabled={loading}
                  style={{
                    padding: '4px 10px',
                    background: theme.bgHover,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    borderRadius: 4,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Reload
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: 12, borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>Plugin Log</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: theme.bgSecondary, borderRadius: 6, border: `1px solid ${theme.border}`, padding: 8 }}>
          {output.length === 0 ? (
            <div style={{ color: theme.textMuted, fontSize: 12 }}>No plugin activity yet.</div>
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
