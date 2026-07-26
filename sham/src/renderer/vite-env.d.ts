/// <reference types="vite/client" />

declare global {
  interface Window {
    shamAPI: {
      parseALP: (payload: { content: string; filePath: string }) => Promise<unknown>;
      validateALP: (payload: { content: string; filePath: string }) => Promise<unknown>;
      getBlockTypes: () => Promise<unknown>;
      runAgent: (payload: { agentId: string; config: Record<string, unknown> }) => Promise<unknown>;
      getAppVersion: () => Promise<unknown>;
      getALPVersion: () => Promise<unknown>;
      onAppReady: (callback: (payload: unknown) => void) => void;
    };
  }
}

export {};