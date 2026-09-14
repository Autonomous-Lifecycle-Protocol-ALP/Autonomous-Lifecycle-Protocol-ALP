import { proStyles } from '../../styles/theme.js';
import type { LicenseInfo, CloudSyncState, TeamState, UpdateStatus } from '../../shared/types.js';

export type Feedback = { type: 'success' | 'error'; message: string } | null;

export { proStyles };
export type { LicenseInfo, CloudSyncState, TeamState, UpdateStatus };

export interface LicenseStatusProps {
  license: LicenseInfo | null;
  licenseKey: string;
  licenseEmail: string;
  loading: boolean;
  onLicenseKeyChange: (value: string) => void;
  onLicenseEmailChange: (value: string) => void;
  onActivate: () => void;
}

export interface CloudSyncProps {
  cloudSync: CloudSyncState | null;
  workspaceId: string;
  loading: boolean;
  onToggle: () => void;
  onWorkspaceIdInput: (value: string) => void;
  onWorkspaceIdBlur: () => void;
  onEndpointChange: (endpoint: string) => void;
  onSyncPush: () => void;
  onSyncPull: () => void;
}

export interface TeamManagementProps {
  team: TeamState | null;
  memberEmail: string;
  onMemberEmailChange: (value: string) => void;
  onInvite: () => void;
  onRemove: (id: string) => void;
}
