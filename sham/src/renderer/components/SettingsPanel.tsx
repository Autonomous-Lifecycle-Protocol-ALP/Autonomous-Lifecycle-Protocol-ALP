import React, { useState } from 'react';

export function SettingsPanel(): React.JSX.Element {
  const [theme, setTheme] = useState('catppuccin');
  const [fontSize, setFontSize] = useState(13);
  const [tabSize, setTabSize] = useState(2);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [telemetry, setTelemetry] = useState(false);

  return (
    <div className="detail-panel">
      <div className="panel-title">Settings</div>

      <div className="section-card">
        <div className="section-card-title">Appearance</div>
        <div className="form-row">
          <div className="form-row-inline">
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Theme</label>
            <select
              className="input-field"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="catppuccin">Catppuccin (Default)</option>
              <option value="dark-plus">Dark+</option>
              <option value="light-plus">Light+</option>
              <option value="monokai">Monokai</option>
              <option value="github-dark">GitHub Dark</option>
            </select>
          </div>
          <div className="form-row-inline">
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Font Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="input-fluid"
                style={{ maxWidth: 200 }}
              />
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', width: 40 }}>{fontSize}</span>
            </div>
          </div>
          <div className="form-row-inline">
            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Tab Size</label>
            <select
              className="input-field"
              style={{ width: 100 }}
              value={tabSize}
              onChange={(e) => setTabSize(Number(e.target.value))}
            >
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="8">8</option>
            </select>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Editor</div>
        <div className="form-row">
          {[
            { label: 'Word Wrap', value: wordWrap, onChange: setWordWrap },
            { label: 'Show Minimap', value: minimap, onChange: setMinimap },
            { label: 'Auto Save', value: autoSave, onChange: setAutoSave },
            { label: 'Send Telemetry', value: telemetry, onChange: setTelemetry },
          ].map((item) => (
            <div key={item.label} className="form-row-inline">
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{item.label}</label>
              <button
                className={`btn btn-sm ${item.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => item.onChange(!item.value)}
              >
                {item.value ? 'On' : 'Off'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">ALP Configuration</div>
        <div className="form-row">
          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Default Agent Runtime</label>
            <select className="input-field input-fluid" defaultValue="local">
              <option value="local">Local (Docker)</option>
              <option value="remote">Remote (SSH)</option>
              <option value="cloud">Cloud (ALP Cloud)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Parser Path</label>
            <input className="input-field input-fluid" defaultValue="@autonomous-lifecycle-protocol-alp/parser@40.0.0" readOnly />
          </div>
          <div>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>SDK Path</label>
            <input className="input-field input-fluid" defaultValue="@autonomous-lifecycle-protocol-alp/sdk@40.0.0" readOnly />
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">About</div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div><strong style={{ color: 'var(--text-primary)' }}>SHAM IDE</strong> v0.1.0</div>
          <div>ALP Runtime v40.0.0</div>
          <div>Electron {process.versions.electron || 'latest'}</div>
          <div style={{ marginTop: 8 }} className="flex-wrap-gap">
            <span className="badge badge-info badge-responsive">Catppuccin</span>
            <span className="badge badge-muted badge-responsive">v40 IDE Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
}



