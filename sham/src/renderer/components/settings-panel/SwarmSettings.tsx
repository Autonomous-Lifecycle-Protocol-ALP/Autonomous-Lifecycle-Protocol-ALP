import React, { useState } from 'react';
import { RUNTIME_OPTIONS, FIELD_LABEL_STYLE } from './shared.js';

export function SwarmSettings(): React.JSX.Element {
  const [runtime, setRuntime] = useState('local');

  return (
    <div className="section-card">
      <div className="section-card-title">ALP Configuration</div>
      <div className="form-row">
        <div>
          <label style={FIELD_LABEL_STYLE}>Default Agent Runtime</label>
          <select className="input-field input-fluid" value={runtime} onChange={(e) => setRuntime(e.target.value)}>
            {RUNTIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={FIELD_LABEL_STYLE}>Parser Path</label>
          <input className="input-field input-fluid" defaultValue="@autonomous-lifecycle-protocol-alp/parser@40.0.0" readOnly />
        </div>
        <div>
          <label style={FIELD_LABEL_STYLE}>SDK Path</label>
          <input className="input-field input-fluid" defaultValue="@autonomous-lifecycle-protocol-alp/sdk@40.0.0" readOnly />
        </div>
      </div>
    </div>
  );
}
