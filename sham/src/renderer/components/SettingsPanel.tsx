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
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div className="panel-title">Settings</div>

      <div className="section-card">
        <div className="section-card-title">Appearance</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Theme</label>
            <select
              className="input-field"
              style={{ width: 200 }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Font Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ width: 120 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 24 }}>{fontSize}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tab Size</label>
            <select
              className="input-field"
              style={{ width: 80 }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Word Wrap', value: wordWrap, onChange: setWordWrap },
            { label: 'Show Minimap', value: minimap, onChange: setMinimap },
            { label: 'Auto Save', value: autoSave, onChange: setAutoSave },
            { label: 'Send Telemetry', value: telemetry, onChange: setTelemetry },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</label>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Default Agent Runtime</label>
            <select className="input-field" defaultValue="local">
              <option value="local">Local (Docker)</option>
              <option value="remote">Remote (SSH)</option>
              <option value="cloud">Cloud (ALP Cloud)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Parser Path</label>
            <input className="input-field" defaultValue="@younglord3302/parser@39.0.0" readOnly />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>SDK Path</label>
            <input className="input-field" defaultValue="@younglord3302/sdk@39.0.0" readOnly />
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">About</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div><strong style={{ color: 'var(--text-primary)' }}>SHAM IDE</strong> v0.1.0</div>
          <div>ALP Runtime v39.0.0</div>
          <div>Electron {process.versions.electron || 'latest'}</div>
          <div style={{ marginTop: 8 }}>
            <span className="badge badge-info">Catppuccin</span>
            <span className="badge badge-muted" style={{ marginLeft: 6 }}>v40 IDE Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
