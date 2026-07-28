import React, { useState, useEffect, useRef } from 'react';

interface Command {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string[];
  category: string;
}

const commands: Command[] = [
  { id: 'editor.new', label: 'File: New ALP File', icon: '&#9998;', shortcut: ['Ctrl', 'N'], category: 'File' },
  { id: 'editor.save', label: 'File: Save', icon: '&#128190;', shortcut: ['Ctrl', 'S'], category: 'File' },
  { id: 'editor.open', label: 'File: Open File...', icon: '&#128194;', shortcut: ['Ctrl', 'O'], category: 'File' },
  { id: 'terminal.toggle', label: 'View: Toggle Terminal', icon: '&#9000;', shortcut: ['Ctrl', '`'], category: 'View' },
  { id: 'terminal.clear', label: 'Terminal: Clear', icon: '&#128465;', category: 'Terminal' },
  { id: 'editor.format', label: 'Format: Format Document', icon: '&#10070;', shortcut: ['Shift', 'Alt', 'F'], category: 'Format' },
  { id: 'git.status', label: 'Git: Show Status', icon: '&#128193;', category: 'Git' },
  { id: 'git.commit', label: 'Git: Commit Changes', icon: '&#128190;', shortcut: ['Ctrl', 'Shift', 'G'], category: 'Git' },
  { id: 'git.diff', label: 'Git: Open Diff', icon: '&#128046;', category: 'Git' },
  { id: 'search.files', label: 'Search: Find in Files', icon: '&#128269;', shortcut: ['Ctrl', 'Shift', 'F'], category: 'Search' },
  { id: 'search.symbols', label: 'Search: Go to Symbol', icon: '&#9733;', shortcut: ['Ctrl', 'Shift', 'O'], category: 'Search' },
  { id: 'copilot.suggest', label: 'Copilot: Get Suggestions', icon: '&#129302;', category: 'AI' },
  { id: 'profiler.start', label: 'Profiler: Start Trace', icon: '&#9201;', category: 'Tools' },
  { id: 'debugger.start', label: 'Debug: Start Debugging', icon: '&#128269;', category: 'Debug' },
  { id: 'debugger.stop', label: 'Debug: Stop Debugging', icon: '&#9632;', category: 'Debug' },
  { id: 'tests.run', label: 'Tests: Run All Tests', icon: '&#128230;', category: 'Testing' },
  { id: 'collab.start', label: 'Collaboration: Start Session', icon: '&#128101;', category: 'Collaboration' },
  { id: 'plugins.list', label: 'Plugins: List Installed', icon: '&#128295;', category: 'Extensions' },
  { id: 'settings.open', label: 'Preferences: Open Settings', icon: '&#9881;', shortcut: ['Ctrl', ','], category: 'Preferences' },
  { id: 'workbench.focusSidebar', label: 'View: Focus Sidebar', icon: '&#9635;', shortcut: ['Ctrl', 'B'], category: 'View' },
];

export function CommandPalette({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onClose, onSelect]);

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>&#128269;</span>
          <input
            ref={inputRef}
            className="input-field"
            style={{ border: 'none', background: 'transparent', padding: 0 }}
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category} style={{ marginBottom: 4 }}>
              <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                {category}
              </div>
              {cmds.map((cmd) => {
                const currentIndex = flatIndex++;
                return (
                  <div
                    key={cmd.id}
                    className={`command-item ${currentIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={() => onSelect(cmd.id)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                  >
                    {cmd.icon && <span className="command-item-icon" dangerouslySetInnerHTML={{ __html: cmd.icon }} />}
                    <span className="command-item-label">{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="command-item-shortcut">
                        {cmd.shortcut.map((k) => (
                          <kbd key={k}>{k}</kbd>
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">&#128269;</div>
              <div className="empty-state-title">No results found</div>
              <div className="empty-state-desc">Try a different search term or browse the commands above.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
