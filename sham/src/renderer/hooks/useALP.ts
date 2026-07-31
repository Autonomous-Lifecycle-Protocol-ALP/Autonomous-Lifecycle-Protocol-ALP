import { useState, useEffect, useCallback } from 'react';
import { parseALPFile, validateALPFile, fetchBlockTypes } from '../shared/alp-client.js';
import type { ParseResult, ALPDiagnostic, ALPAgent, ALPMCPTool } from '../shared/types.js';

export function useALP() {
  const [document, setDocument] = useState<ParseResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<ALPDiagnostic[]>([]);
  const [blockTypes, setBlockTypes] = useState<string[]>([]);
  const [agents, setAgents] = useState<ALPAgent[]>([]);
  const [mcpTools, setMcpTools] = useState<ALPMCPTool[]>([]);
  const [loading, setLoading] = useState(false);

  const parseFile = useCallback(async (content: string, filePath: string) => {
    setLoading(true);
    try {
      const result = await parseALPFile(content, filePath);
      if (result.success) {
        setDocument(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const validateFile = useCallback(async (content: string, filePath: string) => {
    const result = await validateALPFile(content, filePath);
    if (result.success) {
      setDiagnostics(result.diagnostics);
    }
  }, []);

  const refreshBlockTypes = useCallback(async () => {
    const result = await fetchBlockTypes();
    if (result.success) {
      setBlockTypes(result.blockTypes);
    }
  }, []);

  useEffect(() => {
    refreshBlockTypes();
  }, [refreshBlockTypes]);

  return {
    document,
    diagnostics,
    blockTypes,
    agents,
    mcpTools,
    loading,
    parseFile,
    validateFile,
    refreshBlockTypes,
    setAgents,
    setMcpTools,
  };
}