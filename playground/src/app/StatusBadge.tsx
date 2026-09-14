import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export interface StatusBadgeProps {
  completion: number;
  valid: boolean;
  error: string | null;
}

export function StatusBadge({ completion, valid, error }: StatusBadgeProps) {
  return (
    <>
      <div className="telemetry-badge" title="Live task completion metric">
        <div className="telemetry-ring" />
        <span>{completion}% Complete</span>
      </div>
      <div
        className={`status-indicator ${valid ? 'valid' : 'invalid'}`}
        title={error ?? (valid ? 'Verified DAG' : 'Invalid Spec')}
      >
        {valid ? (
          <>
            <FiCheckCircle size={13} /> Verified DAG
          </>
        ) : (
          <>
            <FiAlertCircle size={13} /> Invalid Spec
          </>
        )}
      </div>
    </>
  );
}
