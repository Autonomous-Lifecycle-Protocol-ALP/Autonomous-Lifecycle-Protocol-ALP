import React, { useState } from 'react';

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
  modified: '&#9679;',
  added: '&#10010;',
  deleted: '&#8857;',
  renamed: '&#8596;',
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
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>
            {modifiedCount + addedCount} changed
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mockFiles.map((file) => (
            <div key={file.name} className="list-item">
              <span className="list-item-icon" style={{ color: statusColors[file.status], fontSize: 10 }}>
                {statusIcons[file.status]}
              </span>
              <div className="list-item-content">
                <div className="list-item-title">{file.name}</div>
              </div>
              <span className="badge badge-muted" style={{ fontSize: 10 }}>{file.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Commit</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Message</label>
            <input
              className="input-field"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter commit message..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Branch: <span style={{ color: 'var(--accent)' }}>{branch}</span>
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm">Stage All</button>
              <button className="btn btn-primary btn-sm">Commit</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-title">Repository</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Remote</span>
            <span style={{ color: 'var(--text-primary)' }}>origin</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>URL</span>
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/...
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Branch</span>
            <span style={{ color: 'var(--text-primary)' }}>{branch}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

