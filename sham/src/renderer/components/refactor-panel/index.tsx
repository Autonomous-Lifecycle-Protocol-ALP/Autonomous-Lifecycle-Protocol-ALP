import React, { useState, useEffect } from 'react';
import { RefactorForm } from './RefactorForm.js';
import { RefactorResult } from './RefactorResult.js';
import type { RefactorPanelProps } from './shared.js';
import type { RefactorRename } from '../../shared/types.js';
import {
  refactorFindSymbols,
  refactorRename,
  refactorPreview,
} from '../../shared/alp-client.js';

export function RefactorPanel({
  renames,
  output,
  onUpdateRenames,
  onAppendOutput,
}: RefactorPanelProps): React.JSX.Element {
  const [filePath, setFilePath] = useState('');
  const [symbolName, setSymbolName] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [symbolKind, setSymbolKind] = useState<RefactorRename['kind']>('agent');

  useEffect(() => {
    if (filePath) {
      setLoading(true);
      refactorFindSymbols({ filePath }).then((result) => {
        if (result.success) {
          onUpdateRenames(result.renames);
        }
        setLoading(false);
      });
    }
  }, [filePath]);

  const handlePreview = async () => {
    if (!filePath || !symbolName.trim() || !newName.trim()) return;
    setLoading(true);
    const result = await refactorPreview({
      filePath,
      oldName: symbolName.trim(),
      newName: newName.trim(),
      kind: symbolKind,
    });
    if (result.success) {
      onUpdateRenames(result.renames);
      onAppendOutput([`[REFACTOR] Preview ready: ${result.renames.length} rename(s)`]);
    } else {
      onAppendOutput([`[REFACTOR] Preview failed: ${result.error}`]);
    }
    setLoading(false);
  };

  const handleRename = async () => {
    if (!filePath || !symbolName.trim() || !newName.trim()) return;
    setLoading(true);
    const result = await refactorRename({
      filePath,
      oldName: symbolName.trim(),
      newName: newName.trim(),
      kind: symbolKind,
    });
    if (result.success) {
      onAppendOutput([`[REFACTOR] Renamed ${symbolName.trim()} -> ${newName.trim()} across ${result.renames.length} file(s)`]);
      onUpdateRenames(result.renames);
      setSymbolName('');
      setNewName('');
    } else {
      onAppendOutput([`[REFACTOR] Rename failed: ${result.error}`]);
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 12 }}>
      <RefactorForm
        filePath={filePath}
        symbolName={symbolName}
        newName={newName}
        loading={loading}
        symbolKind={symbolKind}
        onFilePathChange={setFilePath}
        onSymbolNameChange={setSymbolName}
        onNewNameChange={setNewName}
        onSymbolKindChange={setSymbolKind}
        onPreview={handlePreview}
        onRename={handleRename}
      />
      <RefactorResult
        renames={renames}
        output={output}
        loading={loading}
      />
    </div>
  );
}
