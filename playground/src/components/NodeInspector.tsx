import { useState } from 'react';
import { FiX, FiEdit2, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';

interface NodeInspectorProps {
  obj: AlpObject;
  simStatus?: string;
  isEditing: boolean;
  onClose: () => void;
  onToggleEdit: () => void;
  onSave: (fields: {
    id: string;
    status: string;
    description: string;
  }) => void;
  onInjectFailure: (nodeId: string) => void;
}

export function NodeInspector({
  obj,
  simStatus,
  isEditing,
  onClose,
  onToggleEdit,
  onSave,
  onInjectFailure,
}: NodeInspectorProps) {
  const [editId, setEditId] = useState(obj.id);
  const [editStatus, setEditStatus] = useState(simStatus || obj.status || '[ ]');
  const [editDesc, setEditDesc] = useState(obj.description || '');

  const handleSave = () => {
    onSave({
      id: editId || obj.id,
      status: editStatus,
      description: editDesc,
    });
  };

  const rawStatus = simStatus || obj.status || '[ ]';

  const fields = [
    { label: 'Type', value: obj._type },
    { label: 'ID', value: obj.id },
    ...(obj.status ? [{ label: 'Status', value: rawStatus }] : []),
    ...(obj.description ? [{ label: 'Description', value: obj.description }] : []),
    ...Object.entries(obj)
      .filter(([key]) => !['_type', 'id', 'status', 'description'].includes(key))
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: Array.isArray(value)
          ? value.join('\n')
          : typeof value === 'object'
            ? JSON.stringify(value, null, 2)
            : String(value),
      })),
  ];

  return (
    <div className="inspector-panel" role="dialog" aria-modal="true" aria-labelledby="inspector-title">
      <div className="inspector-header">
        <h3 id="inspector-title">@{obj._type} Details</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="inspector-edit-btn" onClick={onToggleEdit}>
            <FiEdit2 size={11} /> {isEditing ? 'View' : 'Edit'}
          </button>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <FiX size={14} />
          </button>
        </div>
      </div>
      <div className="inspector-content">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="inspector-id">ID</label>
              <input
                id="inspector-id"
                type="text"
                className="inspector-input-field"
                value={editId}
                onChange={(e) => setEditId(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inspector-status">Status</label>
              <select
                id="inspector-status"
                className="inspector-input-field"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="[ ]">[ ] Todo</option>
                <option value="[~]">[~] In-Progress</option>
                <option value="[x]">[x] Done</option>
                <option value="[!]">[!] Blocked</option>
                <option value="[?]">[?] Review</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inspector-description">Description</label>
              <input
                id="inspector-description"
                type="text"
                className="inspector-input-field"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="sim-btn apply" onClick={handleSave}>
                <FiCheck size={12} /> Save to Spec
              </button>
              <button className="sim-btn reset" onClick={() => onInjectFailure(obj.id)}>
                <FiAlertTriangle size={12} /> Inject Failure
              </button>
            </div>
          </div>
        ) : (
          <>
            {fields.map((field) => (
              <div key={field.label} className="inspector-field">
                <div className="field-label">{field.label}</div>
                <div className="field-value">{field.value}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              <button
                className="sim-btn reset"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => onInjectFailure(obj.id)}
              >
                <FiAlertTriangle size={12} /> Simulate Failure
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
