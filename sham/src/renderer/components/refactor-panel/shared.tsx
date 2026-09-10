import type { RefactorRename } from '../../shared/types.js';

export interface RefactorPanelProps {
  renames: RefactorRename[];
  output: string[];
  onUpdateRenames: (renames: RefactorRename[]) => void;
  onAppendOutput: (lines: string[]) => void;
}

export const REFACTOR_PANEL_CONTAINER_STYLE = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: 12,
} as const;

export const REFACTOR_PANEL_FORM_STYLE = {
  marginBottom: 12,
} as const;

export const REFACTOR_PANEL_ROW_STYLE = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
} as const;

export const REFACTOR_PANEL_RESULTS_STYLE = {
  flex: 1,
  overflowY: 'auto',
} as const;

export const REFACTOR_PANEL_LOG_STYLE = {
  marginTop: 12,
  borderTop: '1px solid var(--border)',
  paddingTop: 8,
} as const;
