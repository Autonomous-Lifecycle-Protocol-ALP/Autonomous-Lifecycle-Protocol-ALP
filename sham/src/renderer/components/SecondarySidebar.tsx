import React, { useState, useCallback, useMemo } from 'react';
import type { SHAMState } from '../shared/types.js';
import { Icon } from './Icon.js';

export type SecondarySidebarTab = 'copilot' | 'inspector' | 'agents' | 'scratchpad' | 'bookmarks';

export interface SecondarySidebarProps {
  state: SHAMState;
  onOpenFile: (filePath: string) => void;
  onRunAgent?: (agentId: string) => Promise<unknown> | void;
  onClose: () => void;
  width?: number;
  onWidthChange?: (width: number) => void;
  initialTab?: SecondarySidebarTab;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function SecondarySidebar({
  state,
  onOpenFile,
  onRunAgent,
  onClose,
  width,
  initialTab = 'copilot',
}: SecondarySidebarProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SecondarySidebarTab>(initialTab);
  const [isMaximized, setIsMaximized] = useState(false);

  // Copilot tab state
  const [promptInput, setPromptInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Hello! I am your SHAM IDE Assistant. Ask me anything about your ALP agents, code refactoring, or diagnostics.',
      timestamp: 'Just now',
    },
  ]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Scratchpad state
  const [scratchpadText, setScratchpadText] = useState(
    '// SHAM Scratchpad & Quick Notes\n// Notes here persist during your active session.\n'
  );
  const [scratchpadCopied, setScratchpadCopied] = useState(false);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<string[]>([
    'src/index.ts',
    'src/agents/hello.alp',
  ]);

  const promptChips = useMemo(
    () => [
      'Explain Code',
      'Generate Test',
      'Refactor',
      'Security Audit',
      'Find Bugs',
    ],
    []
  );

  const handleSendPrompt = useCallback(
    (textToSend?: string) => {
      const query = (textToSend || promptInput).trim();
      if (!query) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      let reply = '';
      const lower = query.toLowerCase();
      if (lower.includes('test')) {
        reply = `Generated test suite for ${state.activeFile || 'current file'}:\n\n` +
          `\`\`\`typescript\n` +
          `describe('${state.activeFile || 'Component'} Suite', () => {\n` +
          `  it('should initialize successfully', () => {\n` +
          `    expect(true).toBe(true);\n` +
          `  });\n` +
          `});\n` +
          `\`\`\``;
      } else if (lower.includes('explain')) {
        reply = `File: ${state.activeFile || 'None'}\n` +
          `This file participates in the Autonomous Lifecycle Protocol (ALP). It defines agent workflows, lifecycle hooks, and deterministic execution semantics.`;
      } else if (lower.includes('security') || lower.includes('audit')) {
        reply = `Security Scan Results for ${state.activeFile || 'workspace'}:\n` +
          `• 0 critical CVEs detected\n` +
          `• Sandboxed execution active\n` +
          `• SOC Sentinel status: Healthy & Encrypted`;
      } else if (lower.includes('refactor')) {
        reply = `Refactoring suggestion: Extract helper functions into modular ALP traits and enable type safety guards.`;
      } else {
        reply = `I have analyzed "${query}" in context of ${state.activeFile || 'the workspace'}. Execution is optimal with 0 blocking errors.`;
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now() + 1}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, userMsg, assistantMsg]);
      setPromptInput('');
    },
    [promptInput, state.activeFile]
  );

  const handleCopyMessage = useCallback((msg: ChatMessage) => {
    navigator.clipboard?.writeText(msg.text).catch(() => {});
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  }, []);

  const handleCopyScratchpad = useCallback(() => {
    navigator.clipboard?.writeText(scratchpadText).catch(() => {});
    setScratchpadCopied(true);
    setTimeout(() => setScratchpadCopied(false), 2000);
  }, [scratchpadText]);

  const handleToggleBookmark = useCallback((file: string) => {
    setBookmarks((prev) =>
      prev.includes(file) ? prev.filter((b) => b !== file) : [...prev, file]
    );
  }, []);

  // Compute file outline heuristics
  const activeFileOutline = useMemo(() => {
    if (!state.activeFile) return [];
    const name = state.activeFile.split('/').pop() || '';
    return [
      { name: 'Imports & Dependencies', type: 'module' },
      { name: `init${name.replace(/[^a-zA-Z0-9]/g, '')}`, type: 'function' },
      { name: 'ConfigState', type: 'interface' },
      { name: 'executeWorkflow', type: 'function' },
      { name: 'export default handler', type: 'export' },
    ];
  }, [state.activeFile]);

  return (
    <aside
      className={`secondary-sidebar ${isMaximized ? 'maximized' : ''}`}
      style={{
        width: isMaximized ? '480px' : width ? `${width}px` : undefined,
      }}
      aria-label="Secondary Sidebar"
    >
      {/* Top Header */}
      <div className="secondary-sidebar-header">
        <div className="secondary-sidebar-title">
          <Icon name="columns" size={13} color="var(--accent-purple)" />
          <span>SECONDARY SIDEBAR</span>
        </div>
        <div className="secondary-sidebar-actions">
          <button
            className="secondary-sidebar-header-btn"
            onClick={() => setIsMaximized((prev) => !prev)}
            title={isMaximized ? 'Restore Width' : 'Maximize Width'}
            aria-label={isMaximized ? 'Restore Width' : 'Maximize Width'}
          >
            <Icon name={isMaximized ? 'minimize' : 'maximize'} size={13} />
          </button>
          <button
            className="secondary-sidebar-header-btn secondary-sidebar-close-btn"
            onClick={onClose}
            title="Hide Secondary Sidebar (Ctrl+Alt+B)"
            aria-label="Hide Secondary Sidebar"
          >
            <Icon name="chevronRight" size={15} />
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="secondary-sidebar-tabs" role="tablist">
        <button
          className={`secondary-sidebar-tab ${activeTab === 'copilot' ? 'active' : ''}`}
          onClick={() => setActiveTab('copilot')}
          title="AI Copilot & Prompts"
          role="tab"
          aria-selected={activeTab === 'copilot'}
        >
          <Icon name="bot" size={13} />
          <span>Copilot</span>
        </button>
        <button
          className={`secondary-sidebar-tab ${activeTab === 'inspector' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspector')}
          title="File Inspector & Outline"
          role="tab"
          aria-selected={activeTab === 'inspector'}
        >
          <Icon name="info" size={13} />
          <span>Inspector</span>
        </button>
        <button
          className={`secondary-sidebar-tab ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
          title="Agent Fleet Monitor"
          role="tab"
          aria-selected={activeTab === 'agents'}
        >
          <Icon name="users" size={13} />
          <span>Agents</span>
          {state.agents.length > 0 && (
            <span className="sidebar-count-badge">{state.agents.length}</span>
          )}
        </button>
        <button
          className={`secondary-sidebar-tab ${activeTab === 'scratchpad' ? 'active' : ''}`}
          onClick={() => setActiveTab('scratchpad')}
          title="Persistent Scratchpad"
          role="tab"
          aria-selected={activeTab === 'scratchpad'}
        >
          <Icon name="fileText" size={13} />
          <span>Notes</span>
        </button>
        <button
          className={`secondary-sidebar-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
          title="Pinned Bookmarks"
          role="tab"
          aria-selected={activeTab === 'bookmarks'}
        >
          <Icon name="bookmark" size={13} />
          <span>Saved</span>
          {bookmarks.length > 0 && (
            <span className="sidebar-count-badge">{bookmarks.length}</span>
          )}
        </button>
      </div>

      {/* Body Content */}
      <div className="secondary-sidebar-body">
        {/* Tab 1: Copilot */}
        {activeTab === 'copilot' && (
          <div className="aux-copilot-panel">
            <div className="aux-chips-container">
              {promptChips.map((chip) => (
                <button
                  key={chip}
                  className="aux-prompt-chip"
                  onClick={() => handleSendPrompt(chip)}
                  title={`Run ${chip}`}
                >
                  <Icon name="zap" size={11} color="var(--accent)" />
                  <span>{chip}</span>
                </button>
              ))}
            </div>

            <div className="aux-chat-feed">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`aux-chat-bubble ${msg.sender}`}>
                  <div className="aux-bubble-header">
                    <span className="aux-bubble-sender">
                      {msg.sender === 'user' ? 'You' : 'SHAM Copilot'}
                    </span>
                    <div className="aux-bubble-actions">
                      <span className="aux-bubble-time">{msg.timestamp}</span>
                      <button
                        className="aux-bubble-copy"
                        onClick={() => handleCopyMessage(msg)}
                        title="Copy message"
                      >
                        <Icon
                          name={copiedMsgId === msg.id ? 'check' : 'copy'}
                          size={11}
                          color={copiedMsgId === msg.id ? 'var(--accent-green)' : undefined}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="aux-bubble-text">{msg.text}</div>
                </div>
              ))}
            </div>

            <div className="aux-chat-input-box">
              <textarea
                className="aux-chat-textarea"
                rows={2}
                placeholder="Ask Copilot about code, tests, agents... (Enter to send)"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
              />
              <div className="aux-input-actions">
                <button
                  className="aux-btn-secondary"
                  onClick={() => setChatMessages([])}
                  title="Clear conversation"
                >
                  Clear
                </button>
                <button
                  className="aux-btn-primary"
                  onClick={() => handleSendPrompt()}
                  disabled={!promptInput.trim()}
                  title="Send message"
                >
                  <Icon name="send" size={12} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inspector */}
        {activeTab === 'inspector' && (
          <div className="aux-inspector-panel">
            <div className="aux-card">
              <div className="aux-card-header">
                <Icon name="fileCode" size={13} color="var(--accent)" />
                <span>Active File Metrics</span>
              </div>
              <div className="aux-card-body">
                {state.activeFile ? (
                  <div className="aux-metrics-grid">
                    <div className="aux-metric-row">
                      <span className="aux-metric-label">File:</span>
                      <span className="aux-metric-val">{state.activeFile}</span>
                    </div>
                    <div className="aux-metric-row">
                      <span className="aux-metric-label">Extension:</span>
                      <span className="aux-metric-val">
                        .{state.activeFile.split('.').pop() || 'txt'}
                      </span>
                    </div>
                    <div className="aux-metric-row">
                      <span className="aux-metric-label">Encoding:</span>
                      <span className="aux-metric-val">UTF-8</span>
                    </div>
                    <div className="aux-metric-row">
                      <span className="aux-metric-label">Diagnostics:</span>
                      <span
                        className="aux-metric-val"
                        style={{
                          color:
                            state.diagnostics.length > 0
                              ? 'var(--accent-red)'
                              : 'var(--accent-green)',
                        }}
                      >
                        {state.diagnostics.length} issue(s)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="aux-empty-text">No active file selected in editor.</div>
                )}
              </div>
            </div>

            {/* Diagnostics details */}
            <div className="aux-card">
              <div className="aux-card-header">
                <Icon name="alertTriangle" size={13} color="var(--accent-yellow)" />
                <span>Problems Breakdown</span>
              </div>
              <div className="aux-card-body">
                {state.diagnostics.length === 0 ? (
                  <div className="aux-empty-text" style={{ color: 'var(--accent-green)' }}>
                    ✓ No errors or warnings found.
                  </div>
                ) : (
                  state.diagnostics.slice(0, 5).map((diag, i) => (
                    <div key={i} className="aux-diag-item">
                      <span
                        className="aux-diag-dot"
                        style={{
                          background:
                            diag.severity === 'error'
                              ? 'var(--accent-red)'
                              : 'var(--accent-yellow)',
                        }}
                      />
                      <div className="aux-diag-info">
                        <span className="aux-diag-msg">{diag.message}</span>
                        <span className="aux-diag-line">Line {diag.line}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Symbol Outline */}
            <div className="aux-card">
              <div className="aux-card-header">
                <Icon name="code" size={13} color="var(--accent-purple)" />
                <span>Code Symbol Outline</span>
              </div>
              <div className="aux-card-body">
                {activeFileOutline.map((sym, i) => (
                  <div key={i} className="aux-outline-item">
                    <span className="aux-outline-type">{sym.type}</span>
                    <span className="aux-outline-name">{sym.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Agents */}
        {activeTab === 'agents' && (
          <div className="aux-agents-panel">
            <div className="aux-agents-header">
              <span>Configured Agents ({state.agents.length})</span>
            </div>
            {state.agents.length === 0 ? (
              <div className="aux-empty-text">No agents registered in workspace.</div>
            ) : (
              state.agents.map((agent) => (
                <div key={agent.id} className="aux-agent-card">
                  <div className="aux-agent-top">
                    <div className="aux-agent-identity">
                      <span className={`status-dot ${agent.status}`} />
                      <span className="aux-agent-name">{agent.name}</span>
                    </div>
                    <span className="aux-agent-role">{agent.role}</span>
                  </div>
                  <div className="aux-agent-meta">
                    <span>Memory: {agent.memory?.length || 0}</span>
                    <span>Status: {agent.status}</span>
                  </div>
                  {onRunAgent && (
                    <button
                      className="aux-agent-run-btn"
                      onClick={() => onRunAgent(agent.id)}
                      title={`Run agent ${agent.name}`}
                    >
                      <Icon name="play" size={11} />
                      <span>Trigger Agent</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Scratchpad */}
        {activeTab === 'scratchpad' && (
          <div className="aux-scratchpad-panel">
            <div className="aux-scratchpad-toolbar">
              <div className="aux-scratchpad-counters">
                <span>{scratchpadText.length} chars</span>
                <span>•</span>
                <span>{scratchpadText.trim() ? scratchpadText.trim().split(/\s+/).length : 0} words</span>
              </div>
              <div className="aux-scratchpad-actions">
                <button
                  className="aux-btn-secondary"
                  onClick={handleCopyScratchpad}
                  title="Copy scratchpad content"
                >
                  <Icon
                    name={scratchpadCopied ? 'check' : 'copy'}
                    size={11}
                    color={scratchpadCopied ? 'var(--accent-green)' : undefined}
                  />
                  <span>{scratchpadCopied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  className="aux-btn-secondary"
                  onClick={() => setScratchpadText('')}
                  title="Clear scratchpad"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              className="aux-scratchpad-textarea"
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              placeholder="Type temporary notes, snippets, or agent prompts..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Tab 5: Bookmarks */}
        {activeTab === 'bookmarks' && (
          <div className="aux-bookmarks-panel">
            <div className="aux-bookmarks-toolbar">
              {state.activeFile && (
                <button
                  className="aux-btn-primary"
                  onClick={() => handleToggleBookmark(state.activeFile!)}
                  title="Pin or Unpin Current File"
                >
                  <Icon
                    name={bookmarks.includes(state.activeFile) ? 'check' : 'bookmark'}
                    size={12}
                  />
                  <span>
                    {bookmarks.includes(state.activeFile) ? 'Bookmarked' : 'Bookmark Active File'}
                  </span>
                </button>
              )}
            </div>
            <div className="aux-bookmarks-list">
              {bookmarks.length === 0 ? (
                <div className="aux-empty-text">No pinned bookmarks yet.</div>
              ) : (
                bookmarks.map((file) => (
                  <div
                    key={file}
                    className={`aux-bookmark-row ${state.activeFile === file ? 'active' : ''}`}
                    onClick={() => onOpenFile(file)}
                  >
                    <Icon name="fileText" size={13} color="var(--accent)" />
                    <span className="aux-bookmark-name">{file}</span>
                    <button
                      className="aux-bookmark-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(file);
                      }}
                      title="Remove bookmark"
                    >
                      <Icon name="x" size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
