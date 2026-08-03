import React, { useState } from 'react';

interface Skill {
  id: string;
  name: string;
  category: 'analysis' | 'coding' | 'testing' | 'security';
  costPerCall: number;
  rating: number;
  description: string;
}

const sampleSkills: Skill[] = [
  { id: 'skill-code-review', name: 'Automated Code Reviewer', category: 'analysis', costPerCall: 0.05, rating: 4.9, description: 'Analyzes pull requests for code quality and security bugs.' },
  { id: 'skill-unit-test-gen', name: 'Unit Test Generator', category: 'testing', costPerCall: 0.08, rating: 4.8, description: 'Auto-generates high-coverage Vitest and Jest unit tests.' },
  { id: 'skill-sec-auditor', name: 'Vault & Policy Auditor', category: 'security', costPerCall: 0.12, rating: 5.0, description: 'Audits @policy boundaries and sealed X25519 secret envelopes.' },
  { id: 'skill-refactor-bot', name: 'AST Refactoring Bot', category: 'coding', costPerCall: 0.06, rating: 4.7, description: 'Applies automated AST refactoring transformations.' },
];

export function SwarmMarketplacePanel(): React.JSX.Element {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [invocationLog, setInvocationLog] = useState<string[]>([]);

  const filteredSkills = filterCategory === 'all'
    ? sampleSkills
    : sampleSkills.filter(s => s.category === filterCategory);

  const handleInvoke = (skill: Skill) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] Invoked '${skill.name}' (${skill.id}) — Cost: $${skill.costPerCall.toFixed(2)}`;
    setInvocationLog(prev => [logMessage, ...prev]);
  };

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      <div className="panel-header">
        <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginTop: 0, fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--accent)' }}>
           🛒 Swarm Skill Marketplace (v45.0.0)
        </h2>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Discover, invoke, and monitor autonomous agent skills with micro-metered transaction billing.
      </p>

      {/* Category Filters */}
      <div className="flex-wrap-gap" style={{ marginBottom: '16px' }}>
        {['all', 'analysis', 'coding', 'testing', 'security'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`btn btn-sm badge-responsive ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: filterCategory === cat ? 'var(--accent)' : 'var(--bg-secondary)',
              color: filterCategory === cat ? 'var(--bg-primary)' : 'var(--text-primary)',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skill Grid */}
      <div className="grid-auto-fit-lg" style={{ marginBottom: '20px' }}>
        {filteredSkills.map(skill => (
          <div
            key={skill.id}
            onClick={() => setSelectedSkill(skill)}
            className="card"
            style={{
              border: selectedSkill?.id === skill.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-sm)',
              background: 'var(--bg-secondary)',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <div className="flex-between">
              <span style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>{skill.name}</span>
              <span style={{ color: 'var(--accent-yellow)' }}>&#9733; {skill.rating}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', margin: '6px 0' }}>{skill.description}</p>
            <div className="flex-between" style={{ marginTop: '10px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-green)' }}>${skill.costPerCall.toFixed(2)} / call</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleInvoke(skill); }}
                className="btn btn-xs badge-responsive"
                style={{
                  padding: '4px 10px',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                Invoke
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invocation Telemetry Log */}
      {invocationLog.length > 0 && (
        <div className="card">
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-blue)' }}>⚡ Live Invocation Telemetry</h4>
          <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', maxHeight: 'clamp(80px, 15vh, 120px)', overflowY: 'auto' }}>
            {invocationLog.map((log, index) => (
              <div key={index} style={{ padding: '2px 0', color: 'var(--accent-green)' }}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
