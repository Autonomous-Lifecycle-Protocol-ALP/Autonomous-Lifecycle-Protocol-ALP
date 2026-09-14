import React from 'react';
import { Icon } from '../Icon.js';

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function CommandInput({ value, onChange, inputRef }: CommandInputProps): React.JSX.Element {
  return (
    <div className="modal-header panel-header">
      <Icon name="search" size={14} color="var(--text-muted)" />
      <input
        ref={inputRef}
        className="input-field input-fluid"
        style={{ border: 'none', background: 'transparent', padding: 0 }}
        placeholder="Type a command or search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
