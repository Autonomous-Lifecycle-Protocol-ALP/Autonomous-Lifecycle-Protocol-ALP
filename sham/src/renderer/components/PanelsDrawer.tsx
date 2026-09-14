import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from './Icon.js';
import {
  ALL_PANELS,
  PANEL_CATEGORIES,
  type PanelId,
  type PanelCategory,
  type PanelDefinition,
} from '../app/shared.js';

export interface PanelsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePanel: PanelId;
  onSelectPanel: (panel: PanelId) => void;
}

export function PanelsDrawer({
  isOpen,
  onClose,
  activePanel,
  onSelectPanel,
}: PanelsDrawerProps): React.JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PanelCategory | 'all'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredPanels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ALL_PANELS.filter((panel) => {
      const matchesCategory =
        selectedCategory === 'all' || panel.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      return (
        panel.label.toLowerCase().includes(query) ||
        panel.description.toLowerCase().includes(query) ||
        panel.id.toLowerCase().includes(query) ||
        panel.category.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, selectedCategory]);

  const panelsByCategory = useMemo(() => {
    const map = new Map<PanelCategory, PanelDefinition[]>();
    for (const cat of PANEL_CATEGORIES) {
      map.set(cat.id, []);
    }
    for (const panel of filteredPanels) {
      const list = map.get(panel.category);
      if (list) {
        list.push(panel);
      }
    }
    return map;
  }, [filteredPanels]);

  if (!isOpen) return null;

  return (
    <div className="panels-drawer-overlay" onClick={onClose} data-testid="panels-drawer-overlay">
      <div
        className="panels-drawer-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Panels and Tools Drawer"
      >
        <div className="panels-drawer-header">
          <div className="panels-drawer-title-group">
            <div className="panels-drawer-icon-badge">
              <Icon name="layers" size={18} color="var(--accent)" />
            </div>
            <div>
              <h2 className="panels-drawer-title">Panels & Workspaces</h2>
              <p className="panels-drawer-subtitle">
                Access all {ALL_PANELS.length} specialized ALP & IDE environments
              </p>
            </div>
          </div>
          <div className="panels-drawer-header-actions">
            <span className="panels-drawer-count-badge">
              {filteredPanels.length} / {ALL_PANELS.length} Available
            </span>
            <button
              className="panels-drawer-close-btn"
              onClick={onClose}
              title="Close Drawer (Esc)"
              aria-label="Close"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        <div className="panels-drawer-search-bar">
          <Icon name="search" size={16} color="var(--text-muted)" className="panels-drawer-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="panels-drawer-search-input"
            placeholder="Search panels, agents, testing, swarm, telemetry... (ESC to exit)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="panels-drawer-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <div className="panels-drawer-categories">
          <button
            className={`panels-drawer-category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Panels ({ALL_PANELS.length})
          </button>
          {PANEL_CATEGORIES.map((cat) => {
            const count = ALL_PANELS.filter((p) => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                className={`panels-drawer-category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon name={cat.icon} size={13} />
                <span>{cat.label}</span>
                <span className="pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="panels-drawer-body">
          {filteredPanels.length === 0 ? (
            <div className="panels-drawer-empty">
              <Icon name="alertCircle" size={40} color="var(--text-muted)" />
              <div className="panels-drawer-empty-title">No matching panels found</div>
              <div className="panels-drawer-empty-desc">
                No tools matched &ldquo;{searchQuery}&rdquo;. Try another search keyword.
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : selectedCategory === 'all' && !searchQuery ? (
            PANEL_CATEGORIES.map((cat) => {
              const items = panelsByCategory.get(cat.id) || [];
              if (items.length === 0) return null;
              return (
                <div key={cat.id} className="panels-drawer-section">
                  <div className="panels-drawer-section-header">
                    <div className="panels-drawer-section-title">
                      <Icon name={cat.icon} size={15} color="var(--accent)" />
                      <span>{cat.label}</span>
                    </div>
                    <span className="panels-drawer-section-desc">{cat.description}</span>
                  </div>
                  <div className="panels-drawer-grid">
                    {items.map((panel) => {
                      const isActive = activePanel === panel.id;
                      return (
                        <div
                          key={panel.id}
                          className={`panels-drawer-card ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            onSelectPanel(panel.id);
                            onClose();
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectPanel(panel.id);
                              onClose();
                            }
                          }}
                        >
                          <div className="panels-drawer-card-top">
                            <div className="panels-drawer-card-icon">
                              <Icon name={panel.icon} size={18} />
                            </div>
                            <div className="panels-drawer-card-badges">
                              {panel.badge && (
                                <span className={`card-badge ${panel.badge.toLowerCase()}`}>
                                  {panel.badge}
                                </span>
                              )}
                              {panel.shortcut && (
                                <span className="card-shortcut">{panel.shortcut}</span>
                              )}
                              {isActive && (
                                <span className="card-active-dot" title="Currently Active" />
                              )}
                            </div>
                          </div>
                          <div className="panels-drawer-card-title">{panel.label}</div>
                          <div className="panels-drawer-card-desc">{panel.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="panels-drawer-grid">
              {filteredPanels.map((panel) => {
                const isActive = activePanel === panel.id;
                return (
                  <div
                    key={panel.id}
                    className={`panels-drawer-card ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectPanel(panel.id);
                      onClose();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectPanel(panel.id);
                        onClose();
                      }
                    }}
                  >
                    <div className="panels-drawer-card-top">
                      <div className="panels-drawer-card-icon">
                        <Icon name={panel.icon} size={18} />
                      </div>
                      <div className="panels-drawer-card-badges">
                        {panel.badge && (
                          <span className={`card-badge ${panel.badge.toLowerCase()}`}>
                            {panel.badge}
                          </span>
                        )}
                        {panel.shortcut && (
                          <span className="card-shortcut">{panel.shortcut}</span>
                        )}
                        {isActive && (
                          <span className="card-active-dot" title="Currently Active" />
                        )}
                      </div>
                    </div>
                    <div className="panels-drawer-card-title">{panel.label}</div>
                    <div className="panels-drawer-card-desc">{panel.description}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
