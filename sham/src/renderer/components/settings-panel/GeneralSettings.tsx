import React, { useState } from 'react';
import {
  THEME_OPTIONS,
  TAB_SIZE_OPTIONS,
  ToggleSetting,
  LABEL_STYLE,
  MUTED_STYLE,
  ABOUT_TEXT_STYLE,
} from './shared.js';

export function GeneralSettings(): React.JSX.Element {
  const [theme, setTheme] = useState('catppuccin');
  const [fontSize, setFontSize] = useState(13);
  const [tabSize, setTabSize] = useState(2);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [telemetry, setTelemetry] = useState(false);

  return (
    <>
      <div className="section-card">
        <div className="section-card-title">Appearance</div>
        <div className="form-row">
          <div className="form-row-inline">
            <label style={LABEL_STYLE}>Theme</label>
            <select
              className="input-field"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="form-row-inline">
            <label style={LABEL_STYLE}>Font Size</label>
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
              <span style={{ ...MUTED_STYLE, width: 40 }}>{fontSize}</span>
            </div>
          </div>
          <div className="form-row-inline">
            <label style={LABEL_STYLE}>Tab Size</label>
            <select
              className="input-field"
              style={{ width: 100 }}
              value={tabSize}
              onChange={(e) => setTabSize(Number(e.target.value))}
            >
              {TAB_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Editor</div>
        <div className="form-row">
          <ToggleSetting label="Word Wrap" value={wordWrap} onChange={setWordWrap} />
          <ToggleSetting label="Show Minimap" value={minimap} onChange={setMinimap} />
          <ToggleSetting label="Auto Save" value={autoSave} onChange={setAutoSave} />
          <ToggleSetting label="Send Telemetry" value={telemetry} onChange={setTelemetry} />
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">About</div>
        <div style={ABOUT_TEXT_STYLE}>
          <div><strong style={{ color: 'var(--text-primary)' }}>SHAM IDE</strong> v0.1.0</div>
          <div>ALP Runtime v40.0.0</div>
          <div>Electron {process.versions.electron || 'latest'}</div>
          <div style={{ marginTop: 8 }} className="flex-wrap-gap">
            <span className="badge badge-info badge-responsive">Catppuccin</span>
            <span className="badge badge-muted badge-responsive">v40 IDE Intelligence</span>
          </div>
        </div>
      </div>
    </>
  );
}
