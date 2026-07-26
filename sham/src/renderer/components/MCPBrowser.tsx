import React from 'react';
import { theme } from '../styles/theme.js';
import type { ALPMCPTool } from '../shared/types.js';

interface MCPBrowserProps {
  tools: ALPMCPTool[];
}

export function MCPBrowser({ tools }: MCPBrowserProps): React.JSX.Element {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>MCP Tools</div>
      {tools.length === 0 ? (
        <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: 24 }}>No MCP tools loaded. Connect an MCP server to browse available tools.</div>
      ) : (
        <div style={{ overflowY: 'auto' }}>
          {tools.map((tool) => (
            <div key={tool.name} style={{ padding: 10, marginBottom: 8, background: theme.bgSurface, borderRadius: 6, border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: theme.accent }}>{tool.name}</div>
              <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>{tool.description}</div>
              <div style={{ marginTop: 6, fontSize: 11, color: theme.textMuted }}>
                Parameters: {Object.keys(tool.parameters).join(', ') || 'none'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}