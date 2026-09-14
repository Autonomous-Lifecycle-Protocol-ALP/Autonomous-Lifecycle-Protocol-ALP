import React, { useState } from 'react';
import { CapabilityListing } from '@autonomous-lifecycle-protocol-alp/parser';
import { Icon } from '../Icon.js';

interface MarketplaceBrowserProps {
  capabilities: CapabilityListing[];
  onInstallCapability: (capability: CapabilityListing) => void;
}

export function MarketplaceBrowser({ capabilities, onInstallCapability }: MarketplaceBrowserProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const categories = ['all', ...new Set(capabilities.map(c => c.category))];

  const filtered = capabilities.filter(c => {
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesQuery = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Capability Marketplace
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Extensible agent skills and modules vetted for the Autonomous Lifecycle Protocol ecosystem.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
            minWidth: '220px',
          }}
        />
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? 'var(--accent)' : 'var(--bg-secondary)',
              color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${selectedCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Capabilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {filtered.map(cap => (
          <div
            key={cap.capabilityId}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{cap.name}</span>
                <span className="badge" style={{ background: 'var(--accent-blue)22', color: 'var(--accent-blue)', textTransform: 'capitalize', fontSize: '0.7rem' }}>
                  {cap.category}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {cap.description}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ color: '#fbbf24', marginRight: '6px' }}>★ {cap.rating.toFixed(1)}</span>
                <span>{cap.downloads.toLocaleString()} installs</span>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => onInstallCapability(cap)}
                data-testid={`install-cap-${cap.capabilityId}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Icon name="plus" size={12} /> Add to Node
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
