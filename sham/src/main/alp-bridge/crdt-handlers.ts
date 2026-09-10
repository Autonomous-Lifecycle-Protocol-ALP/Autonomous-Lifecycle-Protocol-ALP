import { ipcMain } from 'electron';

export function setupCrdtHandlers(crdtEngine: any) {
  ipcMain.handle('crdt-status', async () => {
    try {
      const states: Record<string, any> = {};
      const engineState = (crdtEngine as any).states as Map<string, any> | undefined;
      if (engineState) {
        for (const [docId] of engineState) {
          states[docId] = crdtEngine.readState(docId);
        }
      }
      return { success: true, data: { states } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('crdt-merge', async () => {
    try {
      const engineState = (crdtEngine as any).states as Map<string, any> | undefined;
      if (!engineState || engineState.size < 2) {
        return { success: true, data: { merged: false, reason: 'insufficient peers for merge' } };
      }
      const entries = Array.from(engineState.entries());
      const [docIdA, local] = entries[0];
      const [docIdB, remote] = entries[1];
      const merged = crdtEngine.merge(local, remote);
      const converged = crdtEngine.readState(docIdA);
      return { success: true, data: { docId: merged.docId, clock: merged.clock, converged } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
