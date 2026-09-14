import React from 'react';
import { StudioTemplate } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface TemplateSelectorProps {
  templates: StudioTemplate[];
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateSelector({ templates, onSelectTemplate }: TemplateSelectorProps): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '4px' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Starter Agent Templates
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Choose a battle-tested architecture to initialize your visual DAG with pre-wired nodes and capabilities.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {templates.map(tpl => (
          <div
            key={tpl.templateId}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'border-color 0.15s',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{tpl.name}</span>
                <span className="badge" style={{ background: 'var(--accent)22', color: 'var(--accent)', textTransform: 'capitalize' }}>
                  {tpl.category}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {tpl.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{tpl.nodes.length} Nodes</span> · <span>{tpl.edges.length} Edges</span>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onSelectTemplate(tpl.templateId)}
                data-testid={`load-template-${tpl.templateId}`}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', fontSize: '0.8rem' }}
              >
                <Icon name="box" size={14} /> Load Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
