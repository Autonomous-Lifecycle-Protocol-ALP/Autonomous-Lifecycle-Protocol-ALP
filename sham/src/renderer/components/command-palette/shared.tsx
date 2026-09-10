export interface Command {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string[];
  category: string;
}

export const commands: Command[] = [
  { id: 'editor.new', label: 'File: New ALP File', icon: 'filePlus', shortcut: ['Ctrl', 'N'], category: 'File' },
  { id: 'editor.save', label: 'File: Save', icon: 'save', shortcut: ['Ctrl', 'S'], category: 'File' },
  { id: 'editor.open', label: 'File: Open File...', icon: 'folder', shortcut: ['Ctrl', 'O'], category: 'File' },
  { id: 'terminal.toggle', label: 'View: Toggle Terminal', icon: 'terminal', shortcut: ['Ctrl', '`'], category: 'View' },
  { id: 'terminal.clear', label: 'Terminal: Clear', icon: 'trash', category: 'Terminal' },
  { id: 'editor.format', label: 'Format: Format Document', icon: 'code', shortcut: ['Shift', 'Alt', 'F'], category: 'Format' },
  { id: 'git.status', label: 'Git: Show Status', icon: 'gitBranch', category: 'Git' },
  { id: 'git.commit', label: 'Git: Commit Changes', icon: 'save', shortcut: ['Ctrl', 'Shift', 'G'], category: 'Git' },
  { id: 'git.diff', label: 'Git: Open Diff', icon: 'gitCompare', category: 'Git' },
  { id: 'search.files', label: 'Search: Find in Files', icon: 'search', shortcut: ['Ctrl', 'Shift', 'F'], category: 'Search' },
  { id: 'search.symbols', label: 'Search: Go to Symbol', icon: 'star', shortcut: ['Ctrl', 'Shift', 'O'], category: 'Search' },
  { id: 'copilot.suggest', label: 'Copilot: Get Suggestions', icon: 'cpu', category: 'AI' },
  { id: 'profiler.start', label: 'Profiler: Start Trace', icon: 'activity', category: 'Tools' },
  { id: 'debugger.start', label: 'Debug: Start Debugging', icon: 'play', category: 'Debug' },
  { id: 'debugger.stop', label: 'Debug: Stop Debugging', icon: 'square', category: 'Debug' },
  { id: 'tests.run', label: 'Tests: Run All Tests', icon: 'playCircle', category: 'Testing' },
  { id: 'collab.start', label: 'Collaboration: Start Session', icon: 'userPlus', category: 'Collaboration' },
  { id: 'collab.share', label: 'Collaboration: Copy Share Link', icon: 'share2', category: 'Collaboration' },
  { id: 'plugins.list', label: 'Plugins: List Installed', icon: 'puzzle', category: 'Extensions' },
  { id: 'synapse.open', label: 'Synapse: Open Knowledge Graph', icon: 'network', shortcut: ['Ctrl', 'Shift', 'K'], category: 'Synapse' },
  { id: 'synapse.export', label: 'Synapse: Export Canvas Vault', icon: 'fileText', category: 'Synapse' },
  { id: 'settings.open', label: 'Preferences: Open Settings', icon: 'settings', shortcut: ['Ctrl', ','], category: 'Preferences' },
  { id: 'workbench.focusSidebar', label: 'View: Focus Sidebar', icon: 'panelLeft', shortcut: ['Ctrl', 'B'], category: 'View' },
];

export function groupCommands(items: Command[]): Record<string, Command[]> {
  return items.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
    return acc;
  }, {});
}
