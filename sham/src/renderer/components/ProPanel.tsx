import { useState, useEffect } from 'react';
import {
  getLicense,
  activateLicense,
  getCloudSync,
  setCloudSync,
  getTeam,
  inviteMember,
  removeMember,
  checkUpdate,
  downloadUpdate,
  installUpdate,
} from '../shared/alp-client.js';
import type { LicenseInfo, CloudSyncState, TeamState, UpdateStatus } from '../shared/types.js';
import { theme, proStyles } from '../styles/theme.js';

type Feedback = { type: 'success' | 'error'; message: string } | null;

export function ProPanel() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [cloudSync, setCloudSyncState] = useState<CloudSyncState | null>(null);
  const [team, setTeam] = useState<TeamState | null>(null);
  const [update, setUpdate] = useState<UpdateStatus | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseEmail, setLicenseEmail] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLicense(await getLicense());
    setCloudSyncState(await getCloudSync());
    setTeam(await getTeam());
  }

  async function handleActivate() {
    setFeedback(null);
    setLoading(true);
    try {
      const info = await activateLicense({
        key: licenseKey,
        email: licenseEmail,
        plan: 'pro',
      });
      setLicense(info);
      setLicenseKey('');
      setLicenseEmail('');
      setFeedback({ type: 'success', message: 'Pro license activated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Activation failed.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCloudSyncToggle() {
    if (!cloudSync) return;
    const next = { ...cloudSync, enabled: !cloudSync.enabled };
    setCloudSyncState(await setCloudSync(next));
  }

  async function handleInvite() {
    setFeedback(null);
    if (!memberEmail) return;
    const state = await inviteMember({
      id: crypto.randomUUID(),
      email: memberEmail,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    setTeam(state);
    setMemberEmail('');
    setFeedback({ type: 'success', message: `Invited ${memberEmail}.` });
  }

  async function handleRemove(id: string) {
    setFeedback(null);
    const state = await removeMember(id);
    setTeam(state);
    setFeedback({ type: 'success', message: 'Member removed.' });
  }

  async function handleCheckUpdate() {
    setFeedback(null);
    setUpdate(await checkUpdate());
  }

  async function handleDownloadUpdate() {
    setFeedback(null);
    setUpdate(await downloadUpdate());
  }

  async function handleInstallUpdate() {
    setFeedback(null);
    setUpdate(await installUpdate());
  }

  const isPro = license?.plan === 'pro' || license?.plan === 'team';

  return (
    <div style={proStyles.panel}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.accentPurple }}>SHAM Pro</h2>

      {feedback && <div style={proStyles.feedback(feedback.type)}>{feedback.message}</div>}

      <section style={proStyles.section}>
        <h3 style={proStyles.sectionTitle}>License</h3>
        {license ? (
          <div>
            <div style={proStyles.licenseRow}>
              <span style={{ color: theme.textMuted, fontSize: 13 }}>Plan</span>
              <span style={proStyles.badge(license.plan)}>{license.plan}</span>
            </div>
            <div style={proStyles.licenseRow}>
              <span style={{ color: theme.textMuted, fontSize: 13 }}>Email</span>
              <span style={{ color: theme.textPrimary, fontSize: 13 }}>{license.email}</span>
            </div>
            {license.expiresAt && (
              <div style={proStyles.licenseRow}>
                <span style={{ color: theme.textMuted, fontSize: 13 }}>Expires</span>
                <span style={{ color: theme.textPrimary, fontSize: 13 }}>{license.expiresAt}</span>
              </div>
            )}
            {license.activatedAt && (
              <div style={proStyles.licenseRow}>
                <span style={{ color: theme.textMuted, fontSize: 13 }}>Activated</span>
                <span style={{ color: theme.textPrimary, fontSize: 13 }}>{license.activatedAt}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              style={proStyles.input}
              placeholder="License key"
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
            />
            <input
              style={proStyles.input}
              placeholder="Email"
              value={licenseEmail}
              onChange={e => setLicenseEmail(e.target.value)}
            />
            <button
              style={{ ...proStyles.button('primary'), opacity: loading || !licenseKey || !licenseEmail ? 0.6 : 1 }}
              onClick={handleActivate}
              disabled={loading || !licenseKey || !licenseEmail}
            >
              {loading ? 'Activating...' : 'Activate Pro'}
            </button>
          </div>
        )}
      </section>

      <section style={proStyles.section}>
        <h3 style={proStyles.sectionTitle}>Updates</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={proStyles.button('default')} onClick={handleCheckUpdate}>Check for Updates</button>
          {update?.available && !update.downloaded && (
            <button style={proStyles.button('default')} onClick={handleDownloadUpdate}>Download Update</button>
          )}
          {update?.downloaded && (
            <button style={proStyles.button('primary')} onClick={handleInstallUpdate}>Install Update & Restart</button>
          )}
          {update?.available === false && (
            <span style={{ color: theme.textMuted, fontSize: 12 }}>No updates available.</span>
          )}
        </div>
      </section>

      <section style={proStyles.section}>
        <h3 style={proStyles.sectionTitle}>Cloud Sync</h3>
        {cloudSync && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={cloudSync.enabled}
                onChange={handleCloudSyncToggle}
                style={{ accentColor: theme.accentPurple }}
              />
              <span style={{ fontSize: 13, color: theme.textPrimary }}>{cloudSync.enabled ? 'Enabled' : 'Disabled'}</span>
            </label>
            {cloudSync.enabled && (
              <input
                style={proStyles.input}
                placeholder="Sync endpoint"
                value={cloudSync.endpoint ?? ''}
                onChange={async e =>
                  setCloudSyncState(await setCloudSync({ enabled: true, endpoint: e.target.value }))
                }
              />
            )}
          </div>
        )}
      </section>

      {isPro && (
        <section style={proStyles.section}>
          <h3 style={proStyles.sectionTitle}>Team Collaboration</h3>
          {team && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {team.members.map(member => (
                  <li key={member.id} style={proStyles.teamItem}>
                    <span style={{ color: theme.textPrimary, fontSize: 13 }}>{member.email}</span>
                    <span style={{ color: theme.textMuted, fontSize: 12, textTransform: 'capitalize' }}>{member.role}</span>
                    <button
                      style={{ ...proStyles.button('danger'), padding: '4px 8px', fontSize: 12 }}
                      onClick={() => handleRemove(member.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {team.members.length === 0 && (
                  <li style={{ color: theme.textMuted, fontSize: 13, padding: '4px 0' }}>No team members yet.</li>
                )}
              </ul>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...proStyles.input, flex: 1 }}
                  placeholder="Invite by email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                />
                <button
                  style={{ ...proStyles.button('primary'), opacity: !memberEmail ? 0.6 : 1 }}
                  onClick={handleInvite}
                  disabled={!memberEmail}
                >
                  Invite
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
