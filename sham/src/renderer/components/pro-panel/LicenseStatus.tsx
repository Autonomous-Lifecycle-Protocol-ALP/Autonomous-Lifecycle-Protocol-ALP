import { proStyles } from './shared.js';
import type { LicenseStatusProps } from './shared.js';

export function LicenseStatus({
  license,
  licenseKey,
  licenseEmail,
  loading,
  onLicenseKeyChange,
  onLicenseEmailChange,
  onActivate,
}: LicenseStatusProps) {
  return (
    <section style={proStyles.section}>
      <h3 style={proStyles.sectionTitle}>License</h3>
      {license ? (
        <div>
          <div style={proStyles.licenseRow}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Plan</span>
            <span style={proStyles.badge(license.plan)}>{license.plan}</span>
          </div>
          <div style={proStyles.licenseRow}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Email</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{license.email}</span>
          </div>
          {license.expiresAt && (
            <div style={proStyles.licenseRow}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Expires</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{license.expiresAt}</span>
            </div>
          )}
          {license.activatedAt && (
            <div style={proStyles.licenseRow}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Activated</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{license.activatedAt}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            style={proStyles.input}
            placeholder="License key"
            value={licenseKey}
            onChange={e => onLicenseKeyChange(e.target.value)}
          />
          <input
            style={proStyles.input}
            placeholder="Email"
            value={licenseEmail}
            onChange={e => onLicenseEmailChange(e.target.value)}
          />
          <button
            style={{ ...proStyles.button('primary'), opacity: loading || !licenseKey || !licenseEmail ? 0.6 : 1 }}
            onClick={onActivate}
            disabled={loading || !licenseKey || !licenseEmail}
          >
            {loading ? 'Activating...' : 'Activate Pro'}
          </button>
        </div>
      )}
    </section>
  );
}
