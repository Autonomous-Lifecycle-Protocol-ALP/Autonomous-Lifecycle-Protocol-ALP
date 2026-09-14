import type { CollabSession, CollabPresence } from '../../shared/types.js';

export type CollabMode = 'host' | 'peer';

export type CollabResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
};

export type Feedback = {
  type: 'success' | 'error';
  message: string;
};

export interface CollaborationPanelProps {
  session: CollabSession | null;
  output: string[];
  presence: CollabPresence[];
  onUpdateSession: (session: CollabSession | null) => void;
  onAppendOutput: (lines: string[]) => void;
  onUpdatePresence: (presence: CollabPresence[]) => void;
}

export interface PresenceListProps {
  presence: CollabPresence[];
}

export interface CommentThreadProps {
  output: string[];
}

export interface ShareControlsProps {
  session: CollabSession | null;
  mode: CollabMode;
  sessionId: string;
  loading: boolean;
  copied: boolean;
  onModeChange: (mode: CollabMode) => void;
  onSessionIdChange: (id: string) => void;
  onStart: () => void;
  onJoin: () => void;
  onCopyShareLink: () => void;
  onLeave: () => void;
  onCRDTStatus: () => void;
  onCRDTMerge: () => void;
}

export const PRESENCE_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];

export const buildPeerPresence = (peers: string[], lastSeenAt: string): CollabPresence[] => {
  return peers.map((peerId, index) => ({
    peerId,
    displayName: `Peer ${index + 1}`,
    color: PRESENCE_COLORS[index % PRESENCE_COLORS.length],
    lastSeenAt,
  }));
};

export const buildShareLink = (sessionId: string): string => {
  return `sham://collab/join/${sessionId}`;
};

export const splitLines = (text: string): string[] => {
  return text.split('\n').filter(Boolean);
};
