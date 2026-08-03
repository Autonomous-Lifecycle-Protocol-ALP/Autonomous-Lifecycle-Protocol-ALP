import React, { useState } from 'react';

interface SearchResult {
  file: string;
  line: number;
  text: string;
}

const mockResults: SearchResult[] = [
  { file: 'sham/src/renderer/App.tsx', line: 35, text: 'export function App(): React.JSX.Element {' },
  { file: 'sham/src/renderer/App.tsx', line: 136, text: 'return (' },
  { file: 'sham/src/renderer/components/Sidebar.tsx', line: 14, text: 'export function Sidebar({' },
  { file: 'sham/src/renderer/components/EditorPanel.tsx', line: 1, text: 'import React, { useState } from "react";' },
  { file: 'sham/src/renderer/components/TerminalPanel.tsx', line: 12, text: 'export function TerminalPanel({' },
];

export function SearchPanel({ onOpenFile }: { onOpenFile: (file: string) => void }): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results] = useState<SearchResult[]>(mockResults);

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div className="panel-title">Search</div>

      <div className="section-card">
        <div className="section-card-title">Search in Files</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="search-wrapper">
            <span className="search-wrapper-icon">&#128269;</span>
            <input
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files, symbols, and references..."
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-info badge-responsive">*.ts</span>
            <span className="badge badge-info badge-responsive">*.tsx</span>
            <span className="badge badge-muted badge-responsive">*.js</span>
            <span className="badge badge-muted badge-responsive">*.css</span>
          </div>
        </div>
      </div>

      <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            {results.length} results
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {query ? `"${query}"` : 'all files'}
          </span>
        </div>
        {results.map((result, i) => (
          <div key={i} className="list-item" onClick={() => onOpenFile(result.file)}>
            <span className="list-item-icon" style={{ color: 'var(--accent)', fontSize: 11 }}>&#128196;</span>
            <div className="list-item-content">
              <div className="list-item-title">{result.file}</div>
              <div className="list-item-subtitle">
                Line {result.line}: {result.text}
              </div>
            </div>
            <span className="badge badge-muted" style={{ fontSize: 10 }}>L{result.line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
