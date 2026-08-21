import { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (block: {
    type: string;
    id: string;
    description: string;
    owner: string;
    dependsOn: string;
  }) => void;
}

export function AddBlockModal({ isOpen, onClose, onCreate }: AddBlockModalProps) {
  const [blockType, setBlockType] = useState('task');
  const [blockId, setBlockId] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [dependsOn, setDependsOn] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!blockId.trim()) return;
    onCreate({
      type: blockType,
      id: blockId.trim(),
      description: description.trim(),
      owner: owner.trim(),
      dependsOn: dependsOn.trim(),
    });
    setBlockId('');
    setDescription('');
    setOwner('');
    setDependsOn('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FiPlus size={16} color="var(--accent-cyan)" /> Create New ALP Primitive</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Primitive Type</label>
            <select
              className="form-select"
              value={blockType}
              onChange={(e) => setBlockType(e.target.value)}
            >
              <option value="task">@task — Executable action node</option>
              <option value="agent">@agent — AI actor profile</option>
              <option value="feature">@feature — Requirement container</option>
              <option value="workflow">@workflow — Pipeline schedule</option>
              <option value="policy">@policy — Security guardrail</option>
              <option value="contract">@contract — Service boundary</option>
              <option value="vault">@vault — Secret repository</option>
              <option value="rule">@rule — Project constraint</option>
              <option value="timeline">@timeline — Scheduled job</option>
              <option value="memory">@memory — Semantic vector store</option>
              <option value="swarm">@swarm — Multi-agent mesh</option>
              <option value="tenant">@tenant — Multi-tenant boundary</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">ID (e.g. task-auth-service)</label>
            <input
              type="text"
              className="form-input"
              placeholder="my-object-id"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="Brief summary of this primitive"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Owner Agent (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="@agent-coder"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Dependencies (Comma-separated IDs)</label>
            <input
              type="text"
              className="form-input"
              placeholder="task-db-schema, task-core"
              value={dependsOn}
              onChange={(e) => setDependsOn(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="action-btn" onClick={onClose}>Cancel</button>
          <button className="sim-btn play" onClick={handleCreate} disabled={!blockId.trim()}>
            <FiPlus size={13} /> Insert into Spec
          </button>
        </div>
      </div>
    </div>
  );
}
