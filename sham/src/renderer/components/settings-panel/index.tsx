import React, { useState } from 'react';
import { SettingsNav } from './SettingsNav.js';
import { GeneralSettings } from './GeneralSettings.js';
import { SwarmSettings } from './SwarmSettings.js';
import { SecuritySettings } from './SecuritySettings.js';
import { SettingsCategory } from './shared.js';

export function SettingsPanel(): React.JSX.Element {
  const [active, setActive] = useState<SettingsCategory>('general');

  return (
    <div className="detail-panel">
      <div className="panel-title">Settings</div>
      <SettingsNav active={active} onChange={setActive} />
      <div className="settings-content">
        {active === 'general' && <GeneralSettings />}
        {active === 'swarm' && <SwarmSettings />}
        {active === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
}
