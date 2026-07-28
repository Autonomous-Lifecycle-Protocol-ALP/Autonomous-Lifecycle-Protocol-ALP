import React from 'react';
import type { ALPMCPTool } from '../shared/types.js';

interface MCPBrowserProps {
  tools: ALPMCPTool[];
}

export function MCPBrowser({ tools }: MCPBrowserProps): React.JSX.Element {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div className="panel-title" style={{ padding: 0, marginBottom: 12 }}>MCP Tools</div>
      {tools.length === 0 ? (
        <div className="empty-state" style={{ height: 'auto', padding: 32 }}>
          <div className="empty-state-icon">&#128230;</div>
          <div className="empty-state-title">No MCP tools loaded</div>
          <div className="empty-state-desc">Connect an MCP server to browse available tools.</div>
        </div>
      ) : (
        <div style={{ overflowY: 'auto' }}>
          {tools.map((tool) => (
            <div key={tool.name} className="section-card" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{tool.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{tool.description}</div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                Parameters: {Object.keys(tool.parameters).join(', ') || 'none'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
