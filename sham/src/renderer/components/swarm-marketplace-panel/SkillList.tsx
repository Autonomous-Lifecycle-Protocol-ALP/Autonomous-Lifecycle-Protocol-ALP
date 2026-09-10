import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { sampleSkills } from './shared.js';

interface SkillListProps {
  filterCategory: string;
  selectedSkill: { id: string; name: string; category: string; costPerCall: number; rating: number; description: string } | null;
  onFilterChange: (cat: string) => void;
  onSelectSkill: (skill: { id: string; name: string; category: string; costPerCall: number; rating: number; description: string }) => void;
  onInvoke: (skill: { id: string; name: string; category: string; costPerCall: number; rating: number; description: string }) => void;
}

export const SkillList: React.FC<SkillListProps> = ({ filterCategory, selectedSkill, onFilterChange, onSelectSkill, onInvoke }) => {
  const filteredSkills = filterCategory === 'all'
    ? sampleSkills
    : sampleSkills.filter(s => s.category === filterCategory);

  return (
    <>
      <div className="flex-wrap-gap" style={{ marginBottom: '16px' }}>
        {['all', 'analysis', 'coding', 'testing', 'security'].map(cat => (
          <button
            key={cat}
            onClick={() => onFilterChange(cat)}
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

      <div className="grid-auto-fit-lg" style={{ marginBottom: '20px' }}>
        {filteredSkills.map(skill => (
          <div
            key={skill.id}
            onClick={() => onSelectSkill(skill)}
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
              <span style={{ color: 'var(--accent-yellow)' }}><Icon name="star" size={14} /> {skill.rating}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', margin: '6px 0' }}>{skill.description}</p>
            <div className="flex-between" style={{ marginTop: '10px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-green)' }}>${skill.costPerCall.toFixed(2)} / call</span>
              <button
                onClick={(e) => { e.stopPropagation(); onInvoke(skill); }}
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
    </>
  );
};
