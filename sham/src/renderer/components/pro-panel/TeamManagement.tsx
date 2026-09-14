import { proStyles } from './shared.js';
import type { TeamManagementProps } from './shared.js';

export function TeamManagement({
  team,
  memberEmail,
  onMemberEmailChange,
  onInvite,
  onRemove,
}: TeamManagementProps) {
  return (
    <section style={proStyles.section}>
      <h3 style={proStyles.sectionTitle}>Team Collaboration</h3>
      {team && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {team.members.map(member => (
              <li key={member.id} style={proStyles.teamItem}>
                <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{member.email}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'capitalize' }}>{member.role}</span>
                <button
                  style={{ ...proStyles.button('danger'), padding: '4px 8px', fontSize: 12 }}
                  onClick={() => onRemove(member.id)}
                >
                  Remove
                </button>
              </li>
            ))}
            {team.members.length === 0 && (
              <li style={{ color: 'var(--text-muted)', fontSize: 13, padding: '4px 0' }}>No team members yet.</li>
            )}
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...proStyles.input, flex: 1 }}
              placeholder="Invite by email"
              value={memberEmail}
              onChange={e => onMemberEmailChange(e.target.value)}
            />
            <button
              style={{ ...proStyles.button('primary'), opacity: !memberEmail ? 0.6 : 1 }}
              onClick={onInvite}
              disabled={!memberEmail}
            >
              Invite
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
