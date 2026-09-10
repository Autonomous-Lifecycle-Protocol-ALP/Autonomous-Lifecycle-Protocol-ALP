import { useState, useEffect, useCallback } from 'react';
import { fetchBlockTypes, runAgent, validateALPFile, onAppReady, collabCursorMove } from '../shared/alp-client.js';
import type { SHAMState } from '../shared/types.js';
import { defaultState } from './shared.js';

export function useAppState() {
  const [state, setState] = useState<SHAMState>(defaultState);

  useEffect(() => {
    onAppReady((_payload: unknown) => {
      setState((prev) => ({ ...prev }));
    });

    fetchBlockTypes().then((result) => {
      if (result.success) {
        setState((prev) => ({ ...prev, blockTypes: result.blockTypes }));
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenFile = useCallback((filePath: string) => {
    setState((prev) => {
      const openFiles = prev.openFiles.includes(filePath) ? prev.openFiles : [...prev.openFiles, filePath];
      return { ...prev, activeFile: filePath, openFiles };
    });
  }, []);

  const handleCloseFile = useCallback((filePath: string) => {
    setState((prev) => {
      const openFiles = prev.openFiles.filter((f) => f !== filePath);
      const activeFile = prev.activeFile === filePath ? (openFiles[0] ?? null) : prev.activeFile;
      return { ...prev, openFiles, activeFile };
    });
  }, []);

  const handleRunAgent = useCallback(async (agentId: string, config: Record<string, unknown>) => {
    const result = await runAgent(agentId, config);
    if (result.success) {
      setState((prev) => ({
        ...prev,
        terminalOutput: [...prev.terminalOutput, `[Agent ${agentId}] Run started`],
        agents: prev.agents.map((a) =>
          a.id === agentId ? { ...a, status: 'running' as const, lastRun: new Date().toISOString() } : a,
        ),
      }));
    }
  }, []);

  const handleValidate = useCallback(async (content: string, filePath: string) => {
    const result = await validateALPFile(content, filePath);
    if (result.success) {
      setState((prev) => ({ ...prev, diagnostics: result.diagnostics }));
    }
  }, []);

  const handleCursorChange = useCallback(async (position: { line: number; column: number }) => {
    if (state.collab.session?.status === 'running') {
      await collabCursorMove({ peerId: 'local', line: position.line, column: position.column });
    }
  }, [state.collab.session?.status]);

  return {
    state,
    setState,
    handleOpenFile,
    handleCloseFile,
    handleRunAgent,
    handleValidate,
    handleCursorChange,
  };
}