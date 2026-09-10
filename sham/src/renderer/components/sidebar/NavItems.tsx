import React from 'react';
import type { SHAMState } from '../shared/types.js';
import { Icon } from '../Icon.js';
import { getFileIcon } from './shared.js';

interface NavItemsProps {
  state: SHAMState;
  onOpenFile: (filePath: string) => void;
  onCloseFile: (filePath: string) => void;
}

export function NavItems({ state, onOpenFile, onCloseFile }: NavItemsProps): React.JSX.Element {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">
        Explorer
        <button className="sidebar-section-action" onClick={() => onOpenFile('untitled.alp')} title="New ALP File">
          <Icon name="plus" size={14} />
        </button>
      </div>
      <div className="sidebar-list">
        {state.openFiles.map((file) => (
          <div
            key={file}
            className={`sidebar-item ${state.activeFile === file ? 'active' : ''}`}
            style={state.activeFile === file ? { background: 'linear-gradient(90deg, rgba(137,180,250,0.1) 0%, transparent 100%)', borderLeftColor: 'var(--accent)', color: 'var(--accent)' } : {}}
            onClick={() => onOpenFile(file)}
          >
            <span className="sidebar-item-icon"><Icon name={getFileIcon(file)} size={14} /></span>
            <span className="sidebar-item-label">{file}</span>
            <button
              className="sidebar-item-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile(file);
              }}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
