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
  cloudSyncStatus,
  cloudSyncPush,
  cloudSyncPull,
} from '../../shared/alp-client.js';
import { LicenseStatus } from './LicenseStatus.js';
import { CloudSync } from './CloudSync.js';
import { TeamManagement } from './TeamManagement.js';
import { proStyles } from './shared.js';
import type { LicenseInfo, CloudSyncState, TeamState, UpdateStatus, Feedback } from './shared.js';

export function ProPanel() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [cloudSync, setCloudSyncState] = useState<CloudSyncState | null>(null);
  const [team, setTeam] = useState<TeamState | null>(null);
  const [update, setUpdate] = useState<UpdateStatus | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseEmail, setLicenseEmail] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLicense(await getLicense());
    setCloudSyncState(await getCloudSync());
    setTeam(await getTeam());
    const cs = await getCloudSync();
    setWorkspaceId(cs.workspaceId ?? '');
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

  async function handleWorkspaceIdChange() {
    if (!cloudSync) return;
    const next = { ...cloudSync, workspaceId: workspaceId || undefined };
    setCloudSyncState(await setCloudSync(next));
  }

  async function handleEndpointChange(endpoint: string) {
    if (!cloudSync) return;
    setCloudSyncState(await setCloudSync({ enabled: true, endpoint, workspaceId: workspaceId || undefined }));
  }

  async function handleSyncPush() {
    setFeedback(null);
    setLoading(true);
    const result = await cloudSyncPush({ data: { workspaceId: cloudSync?.workspaceId ?? '', timestamp: new Date().toISOString() } });
    if (result.success) {
      setFeedback({ type: 'success', message: `Workspace pushed to cloud at ${result.lastSyncAt}` });
    } else {
      setFeedback({ type: 'error', message: result.error ?? 'Push failed' });
    }
    setLoading(false);
  }

  async function handleSyncPull() {
    setFeedback(null);
    setLoading(true);
    const result = await cloudSyncPull();
    if (result.success) {
      setFeedback({ type: 'success', message: `Workspace pulled from cloud at ${result.lastSyncAt}` });
    } else {
      setFeedback({ type: 'error', message: result.error ?? 'Pull failed' });
    }
    setLoading(false);
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
    setUpdate({ available: true, installing: true });
    setUpdate(await installUpdate());
  }

  const isPro = license?.plan === 'pro' || license?.plan === 'team';

  return (
    <div style={proStyles.panel}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--accent-purple)' }}>SHAM Pro</h2>

      {feedback && <div style={proStyles.feedback(feedback.type)}>{feedback.message}</div>}

      <LicenseStatus
        license={license}
        licenseKey={licenseKey}
        licenseEmail={licenseEmail}
        loading={loading}
        onLicenseKeyChange={setLicenseKey}
        onLicenseEmailChange={setLicenseEmail}
        onActivate={handleActivate}
      />

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
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No updates available.</span>
          )}
        </div>
      </section>

      <CloudSync
        cloudSync={cloudSync}
        workspaceId={workspaceId}
        loading={loading}
        onToggle={handleCloudSyncToggle}
        onWorkspaceIdInput={setWorkspaceId}
        onWorkspaceIdBlur={handleWorkspaceIdChange}
        onEndpointChange={handleEndpointChange}
        onSyncPush={handleSyncPush}
        onSyncPull={handleSyncPull}
      />

      {isPro && (
        <TeamManagement
          team={team}
          memberEmail={memberEmail}
          onMemberEmailChange={setMemberEmail}
          onInvite={handleInvite}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
