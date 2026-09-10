import React, { useState, useCallback } from 'react';
import type { SHAMState, TreeNode } from '../shared/types.js';
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
}

function TreeItem({ node, onOpenFile, activeFile, depth = 0 }: TreeItemProps): React.JSX.Element {
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

  if (node.type === 'folder') {
    return (
      <div className="sidebar-tree-folder">
        <div className="sidebar-tree-row" style={{ paddingLeft }} onClick={handleClick}>
          <span className="sidebar-tree-toggle" onClick={toggle}>
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />
          </span>
          <span className="sidebar-tree-icon">
            <Icon name="folderOpen" size={14} />
          </span>
          <span className="sidebar-tree-label">{node.name}</span>
        </div>
        {open && node.children && (
          <div className="sidebar-tree-children">
            {node.children.map((child) => (
              <TreeItem key={child.id} node={child} onOpenFile={onOpenFile} activeFile={activeFile} depth={depth + 1} />
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
  return (
    <div className="sidebar-section" style={{ flex: 1, overflow: 'auto', borderBottom: 'none' }}>
      <div className="sidebar-section-title">Workspace</div>
      <div className="sidebar-list">
        {WORKSPACE_TREE.map((node) => (
          <TreeItem key={node.id} node={node} onOpenFile={onOpenFile} activeFile={state.activeFile} />
        ))}
      </div>
    </div>
  );
}
