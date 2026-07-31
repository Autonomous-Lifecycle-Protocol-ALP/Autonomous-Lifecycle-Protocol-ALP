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
    <div className="marketplace-panel" style={{ padding: '16px', color: '#e0e0e0', fontFamily: 'sans-serif' }}>
      <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginTop: 0 }}>
        🛒 Swarm Skill Marketplace (v45.0.0)
      </h2>
      <p style={{ color: '#aaa', fontSize: '13px' }}>
        Discover, invoke, and monitor autonomous agent skills with micro-metered transaction billing.
      </p>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all', 'analysis', 'coding', 'testing', 'security'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #444',
              background: filterCategory === cat ? '#0066cc' : '#222',
              color: '#fff',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skill Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {filteredSkills.map(skill => (
          <div
            key={skill.id}
            onClick={() => setSelectedSkill(skill)}
            style={{
              border: selectedSkill?.id === skill.id ? '1px solid #0066cc' : '1px solid #333',
              borderRadius: '6px',
              padding: '12px',
              background: '#1e1e1e',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{skill.name}</span>
              <span style={{ color: '#ffd700' }}>★ {skill.rating}</span>
            </div>
            <p style={{ color: '#888', fontSize: '12px', margin: '6px 0' }}>{skill.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '12px', color: '#4caf50' }}>${skill.costPerCall.toFixed(2)} / call</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleInvoke(skill); }}
                style={{
                  padding: '4px 10px',
                  background: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
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
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '12px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0066cc' }}>⚡ Live Invocation Telemetry</h4>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', maxHeight: '120px', overflowY: 'auto' }}>
            {invocationLog.map((log, index) => (
              <div key={index} style={{ padding: '2px 0', color: '#4caf50' }}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
