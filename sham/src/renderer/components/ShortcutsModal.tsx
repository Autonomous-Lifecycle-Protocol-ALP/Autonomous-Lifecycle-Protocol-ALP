import React, { useState, useEffect } from 'react';
import { Icon } from './Icon.js';

interface ShortcutItem {
  category: 'Sidebars & Layout' | 'Navigation & Commands' | 'Editor & Workspace' | 'Execution & Debug';
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { category: 'Sidebars & Layout', keys: ['Ctrl', 'B'], description: 'Toggle Primary Sidebar (Left)' },
  { category: 'Sidebars & Layout', keys: ['Ctrl', 'Alt', 'B'], description: 'Toggle Secondary Sidebar (Right)' },
  { category: 'Sidebars & Layout', keys: ['Ctrl', '`'], description: 'Toggle Bottom Terminal Drawer' },
  { category: 'Sidebars & Layout', keys: ['Ctrl', 'K', 'Z'], description: 'Toggle Distraction-Free Zen Mode' },
  { category: 'Sidebars & Layout', keys: ['Ctrl', 'Shift', 'O'], description: 'Open All 34 Panels Drawer' },
  { category: 'Navigation & Commands', keys: ['Ctrl', 'Shift', 'P'], description: 'Open Command Palette' },
  { category: 'Navigation & Commands', keys: ['F1'], description: 'Open Keyboard Shortcuts Help' },
  { category: 'Navigation & Commands', keys: ['Ctrl', 'F'], description: 'Filter Workspace Files' },
  { category: 'Editor & Workspace', keys: ['Ctrl', 'S'], description: 'Save Active File' },
  { category: 'Editor & Workspace', keys: ['Ctrl', 'W'], description: 'Close Active File Tab' },
  { category: 'Execution & Debug', keys: ['F5'], description: 'Start Debug Session' },
  { category: 'Execution & Debug', keys: ['Ctrl', 'Shift', 'T'], description: 'Run All Test Suites' },
];

export interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps): React.JSX.Element | null {
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(filter.toLowerCase()) ||
      s.category.toLowerCase().includes(filter.toLowerCase()) ||
      s.keys.join('+').toLowerCase().includes(filter.toLowerCase())
  );

  const categories = Array.from(new Set(filteredShortcuts.map((s) => s.category)));

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header">
          <div className="shortcuts-modal-title">
            <Icon name="helpCircle" size={16} color="var(--accent)" />
            <span>Keyboard Shortcuts & Quick Controls</span>
          </div>
          <button
            className="shortcuts-modal-close"
            onClick={onClose}
            title="Close (Escape)"
            aria-label="Close"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="shortcuts-search-box">
          <Icon name="search" size={13} color="var(--text-muted)" />
          <input
            type="text"
            className="shortcuts-search-input"
            placeholder="Search shortcuts (e.g. sidebar, terminal, zen)..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
          {filter && (
            <button
              className="shortcuts-search-clear"
              onClick={() => setFilter('')}
              title="Clear search"
            >
              <Icon name="x" size={11} />
            </button>
          )}
        </div>

        <div className="shortcuts-list">
          {filteredShortcuts.length === 0 ? (
            <div className="shortcuts-empty">No shortcuts matching &quot;{filter}&quot;</div>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="shortcuts-category-group">
                <div className="shortcuts-category-title">{cat}</div>
                {filteredShortcuts
                  .filter((s) => s.category === cat)
                  .map((item, i) => (
                    <div key={i} className="shortcut-row">
                      <span className="shortcut-desc">{item.description}</span>
                      <div className="shortcut-keys">
                        {item.keys.map((k, ki) => (
                          <kbd key={ki} className="shortcut-kbd">
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>

        <div className="shortcuts-modal-footer">
          <span>Tip: Press <kbd className="shortcut-kbd">Esc</kbd> to close anytime</span>
        </div>
      </div>
    </div>
  );
}
