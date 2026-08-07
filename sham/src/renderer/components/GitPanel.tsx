import React, { useState } from 'react';
import { Icon } from './Icon.js';

interface GitFile {
  name: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
}

const mockFiles: GitFile[] = [
  { name: 'sham/src/main/index.ts', status: 'modified' },
  { name: 'sham/src/renderer/App.tsx', status: 'modified' },
  { name: 'docs/ROADMAP_V17_V43.md', status: 'modified' },
  { name: 'sham/src/renderer/components/Sidebar.tsx', status: 'added' },
  { name: 'sham/src/renderer/components/CommandPalette.tsx', status: 'added' },
];

const statusIcons: Record<string, string> = {
  modified: 'edit',
  added: 'plus',
  deleted: 'trash',
  renamed: 'gitCompare',
};

const statusColors: Record<string, string> = {
  modified: 'var(--accent-yellow)',
  added: 'var(--accent-green)',
  deleted: 'var(--accent-red)',
  renamed: 'var(--accent-purple)',
};

export function GitPanel(): React.JSX.Element {
  const [message, setMessage] = useState('feat: add v41 IDE productivity features');
  const [branch] = useState('main');

  const modifiedCount = mockFiles.filter((f) => f.status === 'modified').length;
  const addedCount = mockFiles.filter((f) => f.status === 'added').length;

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div className="panel-title">Source Control</div>

      <div className="section-card">
        <div className="section-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Changes</span>
          <span className="badge badge-responsive" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>
            {modifiedCount + addedCount} changed
          </span>
        </div>
        <div className="list-view">
          {mockFiles.map((file) => (
            <div key={file.name} className="list-item">
              <span className="list-item-icon" style={{ color: statusColors[file.status], fontSize: 10 }}>
                <Icon name={statusIcons[file.status]} size={14} />
              </span>
              <div className="list-item-content">
                <div className="list-item-title">{file.name}</div>
              </div>
              <span className="badge badge-muted badge-responsive">{file.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Commit</div>
        <div className="form-row">
          <div className="form-row">
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Message</label>
            <input
              className="input-field input-fluid"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter commit message..."
            />
          </div>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
            <span className="badge badge-responsive" style={{ fontSize: 'var(--font-size-xs)' }}>
              Branch: <span style={{ color: 'var(--accent)' }}>{branch}</span>
            </span>
            <div className="flex-wrap-gap" style={{ gap: 6 }}>
              <button className="btn btn-secondary btn-sm btn-responsive">Stage All</button>
              <button className="btn btn-primary btn-sm btn-responsive">Commit</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Repository</div>
        <div className="info-row" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span>Remote</span>
          <span style={{ color: 'var(--text-primary)' }}>origin</span>
        </div>
        <div className="info-row" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span>URL</span>
          <span className="table-responsive" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)' }}>
            github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/...
          </span>
        </div>
        <div className="info-row" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span>Branch</span>
          <span style={{ color: 'var(--text-primary)' }}>{branch}</span>
        </div>
      </div>
    </div>
  );
}

