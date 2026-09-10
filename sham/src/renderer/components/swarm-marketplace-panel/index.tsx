import React, { useState } from 'react';
import { Icon } from '../Icon.js';
import { sampleSkills } from './shared.js';
import { SkillList } from './SkillList.js';
import { SkillDetail } from './SkillDetail.js';

export function SwarmMarketplacePanel(): React.JSX.Element {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<{ id: string; name: string; category: string; costPerCall: number; rating: number; description: string } | null>(null);
  const [invocationLog, setInvocationLog] = useState<string[]>([]);

  const handleInvoke = (skill: { id: string; name: string; category: string; costPerCall: number; rating: number; description: string }) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] Invoked '${skill.name}' (${skill.id}) — Cost: $${skill.costPerCall.toFixed(2)}`;
    setInvocationLog(prev => [logMessage, ...prev]);
  };

  return (
    <div className="panel-container" style={{ padding: 'var(--spacing-sm)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      <div className="panel-header">
        <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginTop: 0, fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--accent)' }}>
           <Icon name="shopping-cart" size={20} /> Swarm Skill Marketplace (v45.0.0)
        </h2>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Discover, invoke, and monitor autonomous agent skills with micro-metered transaction billing.
      </p>

      <SkillList
        filterCategory={filterCategory}
        selectedSkill={selectedSkill}
        onFilterChange={setFilterCategory}
        onSelectSkill={setSelectedSkill}
        onInvoke={handleInvoke}
      />

      <SkillDetail invocationLog={invocationLog} />
    </div>
  );
}
