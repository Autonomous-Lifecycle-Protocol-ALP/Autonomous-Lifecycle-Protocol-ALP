import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon.js';
import {
  AGENT_ROLES,
  AGENT_MODELS,
  AGENT_PERMISSIONS,
  AGENT_TEMPLATES,
  type AgentRole,
  type AgentModel,
  type AgentPermission,
  type AgentTemplate,
} from './shared.js';

interface AgentCreatorProps {
  onSubmit: (data: {
    name: string;
    role: AgentRole;
    model: AgentModel;
    permissions: AgentPermission[];
    description: string;
    template?: AgentTemplate;
  }) => void;
  onCancel: () => void;
}

export function AgentCreator({ onSubmit, onCancel }: AgentCreatorProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole>('developer');
  const [model, setModel] = useState<AgentModel>('gpt-4o');
  const [permissions, setPermissions] = useState<AgentPermission[]>(['read', 'write']);
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<AgentTemplate | ''>('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { onCancel(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleTemplateChange = (t: AgentTemplate) => {
    setTemplate(t);
    const tmpl = AGENT_TEMPLATES.find((tt) => tt.value === t);
    if (tmpl) { setRole(tmpl.defaultRole); setModel(tmpl.defaultModel); setPermissions([...tmpl.defaultPermissions]); }
  };

  const handlePermissionToggle = (perm: AgentPermission) => {
    setPermissions((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), role, model, permissions, description: description.trim(), template: template || undefined });
  };

  const isValid = name.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Template:</span>
        {AGENT_TEMPLATES.map((t) => (
          <button key={t.value} type="button" className={`btn btn-sm ${template === t.value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleTemplateChange(t.value)} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input ref={nameRef} type="text" placeholder="Agent name..." value={name} onChange={(e) => setName(e.target.value)} autoFocus style={{ flex: 1.5, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: 'var(--radius)', fontSize: '0.85rem' }} />
        <select value={role} onChange={(e) => setRole(e.target.value as AgentRole)} style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 8px', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
          {AGENT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select value={model} onChange={(e) => setModel(e.target.value as AgentModel)} style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 8px', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}>
          {AGENT_MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} style={{ flex: 2, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: 'var(--radius)', fontSize: '0.8rem' }} />
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>Permissions:</span>
        {AGENT_PERMISSIONS.map((p) => (
          <button key={p.value} type="button" className={`btn btn-sm ${permissions.includes(p.value) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handlePermissionToggle(p.value)} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
            {permissions.includes(p.value) && <span style={{ marginRight: '4px' }}>✓</span>}{p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-sm btn-primary" disabled={!isValid}>Create Agent</button>
      </div>
    </form>
  );
}