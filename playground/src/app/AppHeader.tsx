import {
  FiSliders,
  FiLayers,
  FiGrid,
  FiZap,
  FiCircle,
  FiActivity,
  FiTrendingUp,
  FiMaximize2,
  FiCode,
  FiCopy,
  FiPlus,
  FiBookmark,
  FiShare2,
  FiFileText,
  FiDownload,
  FiImage,
  FiTerminal,
  FiKey,
  FiSun,
  FiMoon,
} from 'react-icons/fi';
import type { AppHeaderProps } from './shared.js';
import { SYNAPSE_STYLE, MULTI_MODAL_STYLE } from './shared.js';
import { StatusBadge } from './StatusBadge.js';

export function AppHeader(props: AppHeaderProps) {
  const {
    templateKey,
    templates,
    onTemplateChange,
    layoutMode,
    onLayoutModeChange,
    showCriticalPath,
    onToggleCriticalPath,
    logPanelCollapsed,
    onToggleLogPanel,
    minimapEnabled,
    onToggleMinimap,
    onAddBlock,
    onSnapshots,
    onAnalytics,
    onSynapse,
    onMultiModal,
    onKbdHelp,
    onFitView,
    onFormat,
    onUndo,
    onRedo,
    onCopyBundle,
    onExportMermaid,
    onExportALP,
    onExportJSON,
    onExportYAML,
    onExportPNG,
    theme,
    onToggleTheme,
    completion,
    valid,
    error,
  } = props;

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">ALP</div>
        <span className="brand-title">Execution Engine &amp; DAG Playground</span>
        <span className="brand-badge">v80.0.0</span>
      </div>

      <div className="header-controls">
        <select
          className="template-select"
          value={templateKey}
          onChange={(e) => onTemplateChange(e.target.value)}
        >
          {Object.entries(templates).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        <div className="layout-switcher">
          <button
            className={`layout-btn ${layoutMode === 'dag' ? 'active' : ''}`}
            onClick={() => onLayoutModeChange('dag')}
            title="Topological DAG Columns"
          >
            <FiSliders size={12} style={{ marginRight: 4 }} /> DAG
          </button>
          <button
            className={`layout-btn ${layoutMode === 'tree' ? 'active' : ''}`}
            onClick={() => onLayoutModeChange('tree')}
            title="Hierarchical Tree"
          >
            <FiLayers size={12} style={{ marginRight: 4 }} /> Tree
          </button>
          <button
            className={`layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
            onClick={() => onLayoutModeChange('grid')}
            title="Grid Matrix"
          >
            <FiGrid size={12} style={{ marginRight: 4 }} /> Grid
          </button>
          <button
            className={`layout-btn ${layoutMode === 'force' ? 'active' : ''}`}
            onClick={() => onLayoutModeChange('force')}
            title="Force-Directed Physics"
          >
            <FiZap size={12} style={{ marginRight: 4 }} /> Force
          </button>
          <button
            className={`layout-btn ${layoutMode === 'circular' ? 'active' : ''}`}
            onClick={() => onLayoutModeChange('circular')}
            title="Circular Layout"
          >
            <FiCircle size={12} style={{ marginRight: 4 }} /> Circular
          </button>
        </div>

        <button
          className={`action-btn ${showCriticalPath ? 'active' : ''}`}
          onClick={onToggleCriticalPath}
          title="Highlight Critical Path (Longest chain)"
        >
          <FiActivity size={13} /> Critical Path
        </button>

        <button className="action-btn" onClick={onAnalytics} title="Topology & Bottleneck Analytics">
          <FiTrendingUp size={13} /> Analytics
        </button>

        <button
          className="action-btn"
          onClick={onSynapse}
          title="Synapse Knowledge Graph, Canvas Vault & Wikilinks"
          style={SYNAPSE_STYLE}
        >
          🧠 Synapse
        </button>

        <button
          className="action-btn"
          onClick={onMultiModal}
          title="Multi-Modal Protocol & VLA Action Space Inspector"
          style={MULTI_MODAL_STYLE}
        >
          👁️ Multi-Modal
        </button>

        <button className="action-btn" onClick={onFitView} title="Fit graph view">
          <FiMaximize2 size={13} /> Fit View
        </button>

        <button className="action-btn" onClick={onFormat} title="Format ALP spec (Ctrl+I)">
          <FiCode size={13} /> Format <span className="kbd-hint">Ctrl+I</span>
        </button>

        <button className="action-btn" onClick={onUndo} title="Undo (Ctrl+Z)">
          Undo <span className="kbd-hint">Ctrl+Z</span>
        </button>

        <button className="action-btn" onClick={onRedo} title="Redo (Ctrl+Shift+Z)">
          Redo <span className="kbd-hint">Ctrl+Shift+Z</span>
        </button>

        <button className="action-btn" onClick={onAddBlock} title="Create new ALP block (Ctrl+N)">
          <FiPlus size={13} /> Add <span className="kbd-hint">Ctrl+N</span>
        </button>

        <button className="action-btn" onClick={onSnapshots} title="Manage Snapshots (Ctrl+K)">
          <FiBookmark size={13} /> Snapshots <span className="kbd-hint">Ctrl+K</span>
        </button>

        <button className="action-btn" onClick={onCopyBundle} title="Copy bundle (Ctrl+S)">
          <FiCopy size={13} /> Copy <span className="kbd-hint">Ctrl+S</span>
        </button>

        <button className="action-btn" onClick={onExportMermaid} title="Export Mermaid diagram (Ctrl+M)">
          <FiShare2 size={13} /> Mermaid <span className="kbd-hint">Ctrl+M</span>
        </button>

        <button className="action-btn" onClick={onExportALP} title="Export as spec.alp">
          <FiFileText size={13} /> .alp
        </button>

        <button className="action-btn" onClick={onExportJSON} title="Export spec as JSON (Ctrl+E)">
          <FiDownload size={13} /> JSON <span className="kbd-hint">Ctrl+E</span>
        </button>

        <button className="action-btn" onClick={onExportYAML} title="Export spec as YAML (Ctrl+Y)">
          <FiFileText size={13} /> YAML <span className="kbd-hint">Ctrl+Y</span>
        </button>

        <button className="action-btn" onClick={onExportPNG} title="Export canvas as PNG (Ctrl+P)">
          <FiImage size={13} /> PNG <span className="kbd-hint">Ctrl+P</span>
        </button>

        <button
          className={`action-btn ${!logPanelCollapsed ? 'active' : ''}`}
          onClick={onToggleLogPanel}
          title="Toggle validation log panel (Ctrl+L)"
        >
          <FiTerminal size={13} /> Logs <span className="kbd-hint">Ctrl+L</span>
        </button>

        <button
          className={`action-btn ${minimapEnabled ? 'active' : ''}`}
          onClick={onToggleMinimap}
          title="Toggle graph minimap"
        >
          <FiLayers size={13} /> Minimap
        </button>

        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <FiSun size={15} /> : <FiMoon size={15} />}
        </button>

        <button className="action-btn" onClick={onKbdHelp} title="Keyboard shortcuts (Ctrl+/)">
          <FiKey size={13} /> <span className="kbd-hint">Ctrl+/</span>
        </button>

        <StatusBadge completion={completion} valid={valid} error={error} />
      </div>
    </header>
  );
}
