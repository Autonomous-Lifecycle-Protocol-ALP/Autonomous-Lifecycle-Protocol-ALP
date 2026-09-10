import React, { useState } from 'react';
import { ToggleSetting, LABEL_STYLE } from './shared.js';

interface ApiKeyEntry {
  id: string;
  name: string;
  masked: string;
}

const API_KEYS: ApiKeyEntry[] = [
  { id: 'alp-cloud', name: 'ALP Cloud Key', masked: '••••••••4f2a' },
];

export function SecuritySettings(): React.JSX.Element {
  const [encryptLocal, setEncryptLocal] = useState(true);
  const [unlockOnWake, setUnlockOnWake] = useState(false);
  const [showKey, setShowKey] = useState(false);

  return (
    <>
      <div className="section-card">
        <div className="section-card-title">Security</div>
        <div className="form-row">
          <ToggleSetting label="Encrypt Local Storage" value={encryptLocal} onChange={setEncryptLocal} />
          <ToggleSetting label="Unlock on Wake" value={unlockOnWake} onChange={setUnlockOnWake} />
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">API Keys</div>
        <div className="form-row">
          {API_KEYS.map((key) => (
            <div key={key.id} className="form-row-inline" style={{ width: '100%' }}>
              <label style={LABEL_STYLE}>{key.name}</label>
              <input
                type={showKey ? 'text' : 'password'}
                className="input-field input-fluid"
                value={showKey ? 'alp-sk-live-4f2a91c7e8d6' : key.masked}
                readOnly
                style={{ maxWidth: 240 }}
              />
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowKey((v) => !v)}
                style={{ marginLeft: 'auto' }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
