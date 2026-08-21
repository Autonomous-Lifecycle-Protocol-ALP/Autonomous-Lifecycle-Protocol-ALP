import { useState } from 'react';
import { FiX, FiBookmark, FiTrash2 } from 'react-icons/fi';

export interface Snapshot {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

interface SnapshotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: Snapshot[];
  onSave: (name: string) => void;
  onLoad: (snap: Snapshot) => void;
  onDelete: (id: string) => void;
}

export function SnapshotsModal({
  isOpen,
  onClose,
  snapshots,
  onSave,
  onLoad,
  onDelete,
}: SnapshotsModalProps) {
  const [nameInput, setNameInput] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(nameInput);
    setNameInput('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FiBookmark size={16} color="var(--accent-purple)" /> Workspace Snapshots</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Snapshot name (e.g. Before refactoring)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="sim-btn play" onClick={handleSave}>
              <FiBookmark size={13} /> Save
            </button>
          </div>

          <div className="snapshot-list">
            {snapshots.length === 0 ? (
              <div className="sidebar-empty">No saved snapshots yet</div>
            ) : (
              snapshots.map((snap) => (
                <div key={snap.id} className="snapshot-item">
                  <div className="snapshot-info">
                    <span className="snapshot-name">{snap.name}</span>
                    <span className="snapshot-date">{snap.createdAt} · {snap.code.split('\n').length} lines</span>
                  </div>
                  <div className="snapshot-actions">
                    <button className="action-btn" onClick={() => onLoad(snap)}>
                      Restore
                    </button>
                    <button className="modal-close" onClick={() => onDelete(snap.id)} title="Delete snapshot">
                      <FiTrash2 size={13} color="var(--accent-rose)" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="action-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
