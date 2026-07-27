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
import type {
  LicenseInfo,
  CloudSyncState,
  TeamState,
  UpdateStatus,
} from '../shared/types.js';

export function ProPanel() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [cloudSync, setCloudSyncState] = useState<CloudSyncState | null>(null);
  const [team, setTeam] = useState<TeamState | null>(null);
  const [update, setUpdate] = useState<UpdateStatus | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseEmail, setLicenseEmail] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLicense(await getLicense());
    setCloudSyncState(await getCloudSync());
    setTeam(await getTeam());
  }

  async function handleActivate() {
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
    if (!memberEmail) return;
    const state = await inviteMember({
      id: crypto.randomUUID(),
      email: memberEmail,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    setTeam(state);
    setMemberEmail('');
  }

  async function handleRemove(id: string) {
    const state = await removeMember(id);
    setTeam(state);
  }

  async function handleCheckUpdate() {
    setUpdate(await checkUpdate());
  }

  async function handleDownloadUpdate() {
    setUpdate(await downloadUpdate());
  }

  async function handleInstallUpdate() {
    setUpdate(await installUpdate());
  }

  const isPro = license?.plan === 'pro' || license?.plan === 'team';

  return (
    <div className="pro-panel">
      <h2>SHAM Pro</h2>

      <section>
        <h3>License</h3>
        {license ? (
          <div>
            <p>Plan: {license.plan}</p>
            <p>Email: {license.email}</p>
            {license.expiresAt && <p>Expires: {license.expiresAt}</p>}
          </div>
        ) : (
          <div>
            <input
              placeholder="License key"
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
            />
            <input
              placeholder="Email"
              value={licenseEmail}
              onChange={e => setLicenseEmail(e.target.value)}
            />
            <button onClick={handleActivate} disabled={loading || !licenseKey || !licenseEmail}>
              Activate Pro
            </button>
          </div>
        )}
      </section>

      <section>
        <h3>Updates</h3>
        <button onClick={handleCheckUpdate}>Check for Updates</button>
        {update?.available && !update.downloaded && (
          <button onClick={handleDownloadUpdate}>Download Update</button>
        )}
        {update?.downloaded && (
          <button onClick={handleInstallUpdate}>Install Update & Restart</button>
        )}
      </section>

      <section>
        <h3>Cloud Sync</h3>
        {cloudSync && (
          <div>
            <label>
              <input
                type="checkbox"
                checked={cloudSync.enabled}
                onChange={handleCloudSyncToggle}
              />
              Enabled
            </label>
            {cloudSync.enabled && (
              <input
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
        <section>
          <h3>Team Collaboration</h3>
          {team && (
            <div>
              <ul>
                {team.members.map(member => (
                  <li key={member.id}>
                    {member.email} ({member.role})
                    <button onClick={() => handleRemove(member.id)}>Remove</button>
                  </li>
                ))}
              </ul>
              <input
                placeholder="Invite by email"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
              />
              <button onClick={handleInvite} disabled={!memberEmail}>
                Invite
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
