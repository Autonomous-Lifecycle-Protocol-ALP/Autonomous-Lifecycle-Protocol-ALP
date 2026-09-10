export interface SymbolEntry {
  id: string;
  type: string;
  uri: string;
  line: number;
  properties: Record<string, any>;
}

export let workspaceIndex: Map<string, SymbolEntry> = new Map();
export let workspaceRoot: string = '';

export function setWorkspaceRoot(root: string): void {
  workspaceRoot = root;
}

export function getWorkspaceIndex(): Map<string, SymbolEntry> {
  return workspaceIndex;
}

export function getWorkspaceRoot(): string {
  return workspaceRoot;
}
