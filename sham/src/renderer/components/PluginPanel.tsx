import React, { useState, useEffect } from 'react';
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
        <div className="panel-title" style={{ padding: 0, marginBottom: 8 }}>Plugins</div>
        {feedback && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              marginBottom: 8,
              backgroundColor: feedback.type === 'success' ? 'rgba(166, 227, 161, 0.1)' : 'rgba(243, 139, 168, 0.1)',
              color: feedback.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            }}
          >
            {feedback.message}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          {plugins.length} plugin{plugins.length === 1 ? '' : 's'} discovered from the bundled plugins directory.
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {plugins.length === 0 ? (
          <div className="empty-state" style={{ height: 'auto', padding: 24 }}>
            <div className="empty-state-icon">&#128295;</div>
            <div className="empty-state-title">No plugins found</div>
            <div className="empty-state-desc">Drop plugin folders into the bundled `plugins/` directory to extend SHAM.</div>
          </div>
        ) : (
          plugins.map((plugin) => (
            <div
              key={plugin.manifest.id}
              className="section-card"
              style={{ marginBottom: 8, opacity: plugin.enabled ? 1 : 0.7 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{plugin.manifest.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {plugin.manifest.id} · v{plugin.manifest.version}
                  </div>
                  {plugin.manifest.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{plugin.manifest.description}</div>
                  )}
                  {plugin.error && (
                    <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>Error: {plugin.error}</div>
                  )}
                </div>
                <span
                  className={`badge ${plugin.enabled ? 'badge-success' : 'badge-muted'}`}
                >
                  {plugin.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button
                  className={`btn btn-sm ${plugin.enabled ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleToggle(plugin)}
                  disabled={loading}
                >
                  {plugin.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleReload(plugin)} disabled={loading}>
                  Reload
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Plugin Log</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)', padding: 8 }}>
          {output.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No plugin activity yet.</div>
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
