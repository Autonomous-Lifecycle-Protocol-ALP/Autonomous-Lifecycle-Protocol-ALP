import { proStyles } from './shared.js';
import type { CloudSyncProps } from './shared.js';

export function CloudSync({
  cloudSync,
  workspaceId,
  loading,
  onToggle,
  onWorkspaceIdInput,
  onWorkspaceIdBlur,
  onEndpointChange,
  onSyncPush,
  onSyncPull,
}: CloudSyncProps) {
  return (
    <section style={proStyles.section}>
      <h3 style={proStyles.sectionTitle}>Cloud Sync</h3>
      {cloudSync && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cloudSync.enabled}
              onChange={onToggle}
              style={{ accentColor: 'var(--accent-purple)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{cloudSync.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
          {cloudSync.enabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                style={proStyles.input}
                placeholder="Workspace ID"
                value={workspaceId}
                onChange={e => onWorkspaceIdInput(e.target.value)}
                onBlur={onWorkspaceIdBlur}
              />
              <input
                style={proStyles.input}
                placeholder="Sync endpoint"
                value={cloudSync.endpoint ?? ''}
                onChange={e => onEndpointChange(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{ ...proStyles.button('default'), opacity: loading ? 0.6 : 1 }} onClick={onSyncPush} disabled={loading}>
                  {loading ? 'Syncing...' : 'Push'}
                </button>
                <button style={{ ...proStyles.button('default'), opacity: loading ? 0.6 : 1 }} onClick={onSyncPull} disabled={loading}>
                  {loading ? 'Syncing...' : 'Pull'}
                </button>
                {cloudSync.lastSyncAt && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, alignSelf: 'center' }}>
                    Last sync: {new Date(cloudSync.lastSyncAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
