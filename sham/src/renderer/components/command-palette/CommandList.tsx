import React from 'react';
import { Command } from './shared.js';
import { Icon } from '../Icon.js';

interface CommandListProps {
  grouped: Record<string, Command[]>;
  selectedIndex: number;
  onSelect: (id: string) => void;
  onHover: (index: number) => void;
}

export function CommandList({ grouped, selectedIndex, onSelect, onHover }: CommandListProps): React.JSX.Element {
  let flatIndex = 0;

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><Icon name="search" size={32} color="var(--text-muted)" /></div>
        <div className="empty-state-title">No results found</div>
        <div className="empty-state-desc">Try a different search term or browse the commands above.</div>
      </div>
    );
  }

  return (
    <>
      {Object.entries(grouped).map(([category, cmds]) => (
        <div key={category} style={{ marginBottom: 4 }}>
          <div style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
            {category}
          </div>
          {cmds.map((cmd) => {
            const currentIndex = flatIndex++;
            return (
              <div
                key={cmd.id}
                className={`command-item ${currentIndex === selectedIndex ? 'selected' : ''}`}
                onClick={() => onSelect(cmd.id)}
                onMouseEnter={() => onHover(currentIndex)}
              >
                {cmd.icon && <Icon name={cmd.icon as any} size={16} />}
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
    </>
  );
}
