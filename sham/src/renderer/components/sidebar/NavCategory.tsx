import React, { useState, useCallback } from 'react';
import type { SHAMState } from '../../shared/types.js';
import type { TreeNode } from './shared.js';
import { Icon } from '../Icon.js';
import { WORKSPACE_TREE, getFileIcon } from './shared.js';

interface NavCategoryProps {
  state: SHAMState;
  onOpenFile: (filePath: string) => void;
}

interface TreeItemProps {
  node: TreeNode;
  onOpenFile: (path: string) => void;
  activeFile: string | null;
  depth?: number;
  isSearching?: boolean;
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  return nodes.reduce<TreeNode[]>((acc, node) => {
    if (node.type === 'file') {
      if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) {
        acc.push(node);
      }
    } else if (node.type === 'folder') {
      const filteredChildren = node.children ? filterTree(node.children, query) : [];
      if (filteredChildren.length > 0 || node.name.toLowerCase().includes(q)) {
        acc.push({ ...node, children: filteredChildren });
      }
    }
    return acc;
  }, []);
}

function TreeItem({ node, onOpenFile, activeFile, depth = 0, isSearching = false }: TreeItemProps): React.JSX.Element {
  const [open, setOpen] = useState(true);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  const handleClick = useCallback(() => {
    if (node.type === 'file') {
      onOpenFile(node.path);
    } else {
      setOpen((prev) => !prev);
    }
  }, [node, onOpenFile]);

  const paddingLeft = 12 + depth * 14;
  const isExpanded = isSearching ? true : open;

  if (node.type === 'folder') {
    return (
      <div className="sidebar-tree-folder">
        <div className="sidebar-tree-row" style={{ paddingLeft }} onClick={handleClick}>
          <span className="sidebar-tree-toggle" onClick={toggle}>
            <Icon name={isExpanded ? 'chevronDown' : 'chevronRight'} size={12} />
          </span>
          <span className="sidebar-tree-icon">
            <Icon name="folderOpen" size={14} />
          </span>
          <span className="sidebar-tree-label">{node.name}</span>
        </div>
        {isExpanded && node.children && (
          <div className="sidebar-tree-children">
            {node.children.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                onOpenFile={onOpenFile}
                activeFile={activeFile}
                depth={depth + 1}
                isSearching={isSearching}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`sidebar-tree-row sidebar-tree-file ${activeFile === node.path ? 'active' : ''}`}
      style={{ paddingLeft: paddingLeft + 16 }}
      onClick={handleClick}
    >
      <span className="sidebar-tree-icon">
        <Icon name={(node.icon as any) || getFileIcon(node.name) as any} size={14} />
      </span>
      <span className="sidebar-tree-label">{node.name}</span>
    </div>
  );
}

export function NavCategory({ state, onOpenFile }: NavCategoryProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const visibleTree = React.useMemo(() => {
    return filterTree(WORKSPACE_TREE, search);
  }, [search]);

  return (
    <div className="sidebar-section" style={{ flex: 1, overflow: 'auto', borderBottom: 'none' }}>
      <div className="sidebar-section-title">
        <span>Workspace</span>
        <button
          className="sidebar-section-action"
          onClick={() => {
            setShowSearch((prev) => {
              if (prev) setSearch('');
              return !prev;
            });
          }}
          title={showSearch ? 'Close Search' : 'Filter Workspace Files'}
          style={{ opacity: showSearch ? 1 : undefined }}
        >
          <Icon name={showSearch ? 'x' : 'search'} size={12} />
        </button>
      </div>

      {showSearch && (
        <div className="sidebar-search-container">
          <Icon name="search" size={12} color="var(--text-muted)" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Filter files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button className="sidebar-search-clear" onClick={() => setSearch('')} title="Clear">
              <Icon name="x" size={10} />
            </button>
          )}
        </div>
      )}

      <div className="sidebar-list">
        {visibleTree.length === 0 ? (
          <div className="sidebar-empty">No matching files found</div>
        ) : (
          visibleTree.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              onOpenFile={onOpenFile}
              activeFile={state.activeFile}
              isSearching={Boolean(search)}
            />
          ))
        )}
      </div>
    </div>
  );
}
