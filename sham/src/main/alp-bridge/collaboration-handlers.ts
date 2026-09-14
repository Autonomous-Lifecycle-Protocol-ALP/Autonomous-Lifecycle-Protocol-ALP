import { ipcMain } from 'electron';

export function setupCollaborationHandlers(collabEngine: any) {
  ipcMain.handle('collab-start', async (_event, { mode }: { mode: 'host' | 'peer' }) => {
    try {
      const docId = mode === 'host' ? `live-share-${Date.now()}` : `session-${Date.now()}`;
      const session = collabEngine.createSession(docId);
      let liveShare = null;
      if (mode === 'host') {
        liveShare = collabEngine.startLiveShare(docId, 'local-user');
      }
      return { success: true, data: { docId, sessionId: liveShare?.sessionId ?? docId, mode, createdAt: session.createdAt, agents: session.agents.size, operations: session.operations.length } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('collab-join', async (_event, { sessionId }: { sessionId: string }) => {
    try {
      const liveShares = collabEngine.getLiveShares(sessionId);
      const target = liveShares.length > 0 ? liveShares[0] : null;
      if (!target) {
        const session = collabEngine.getSession(sessionId);
        if (!session) {
          return { success: false, error: `Session '${sessionId}' not found` };
        }
        const presence = collabEngine.joinSession(sessionId, 'local-user');
        return { success: true, data: { sessionId, joined: true, presence } };
      }
      const ok = collabEngine.joinLiveShare(target.sessionId, 'local-user');
      return { success: ok, data: { sessionId: target.sessionId, docId: target.docId, joined: ok, guests: target.guests } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('collab-status', async () => {
    try {
      const sessions = collabEngine.getLiveShares('');
      const allSessions: Array<{ docId: string; sessionId: string; hostId: string; guests: string[]; status: string }> = [];
      for (const [docId, session] of (collabEngine as any).sessions || new Map()) {
        const shares = collabEngine.getLiveShares(docId);
        for (const share of shares) {
          allSessions.push({ docId, sessionId: share.sessionId, hostId: share.hostId, guests: share.guests, status: share.status });
        }
      }
      return { success: true, data: { sessions: allSessions } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('collab-leave', async () => {
    try {
      const activeShares = collabEngine.getLiveShares('');
      let left = false;
      for (const share of activeShares) {
        if (share.guests.includes('local-user') || share.hostId === 'local-user') {
          collabEngine.endLiveShare(share.sessionId, 'local-user');
          left = true;
        }
      }
      return { success: true, left };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('collab-cursor', async (_event, payload: { peerId: string; line: number; column: number; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) => {
    return { success: true, received: true };
  });

  ipcMain.handle('collab-broadcast-presence', async (_event, payload: { peerId: string; displayName: string; color: string; cursor?: { line: number; column: number }; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }) => {
    return { success: true, received: true };
  });
}
