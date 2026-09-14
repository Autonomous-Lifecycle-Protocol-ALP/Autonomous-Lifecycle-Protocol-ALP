import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CommandInput } from './CommandInput.js';
import { CommandList } from './CommandList.js';
import { CommandDetail } from './CommandDetail.js';
import { commands, groupCommands } from './shared.js';

export function CommandPalette({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() =>
    commands.filter((cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  );

  const grouped = useMemo(() => groupCommands(filtered), [filtered]);

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

  const selectedCommand = filtered[selectedIndex] ?? null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'clamp(400px, 80vw, 600px)', width: '90vw' }}>
        <CommandInput value={query} onChange={setQuery} inputRef={inputRef} />
        <div style={{ display: 'flex', maxHeight: 'clamp(200px, 40vh, 320px)' }}>
          <div className="modal-body table-responsive" style={{ flex: 1, padding: 0, overflowY: 'auto' }}>
            <CommandList
              grouped={grouped}
              selectedIndex={selectedIndex}
              onSelect={onSelect}
              onHover={setSelectedIndex}
            />
          </div>
          <div style={{ width: '40%', borderLeft: '1px solid var(--border-color)', overflowY: 'auto', maxHeight: 'clamp(200px, 40vh, 320px)' }}>
            <CommandDetail command={selectedCommand} />
          </div>
        </div>
      </div>
    </div>
  );
}
