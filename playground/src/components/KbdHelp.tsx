import { FiX, FiKey } from 'react-icons/fi';

interface KbdHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KbdHelp({ isOpen, onClose }: KbdHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FiKey size={16} color="var(--accent-cyan)" /> Keyboard Shortcuts</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="kbd-grid">
            <kbd>Ctrl+S</kbd> <span>Copy ALP Spec</span>
            <kbd>Ctrl+I</kbd> <span>Format ALP Spec</span>
            <kbd>Ctrl+N</kbd> <span>Create New Block</span>
            <kbd>Ctrl+K</kbd> <span>Snapshots / History</span>
            <kbd>Ctrl+M</kbd> <span>Export Mermaid Diagram</span>
            <kbd>Ctrl+E</kbd> <span>Export as JSON</span>
            <kbd>Ctrl+B</kbd> <span>Toggle Explorer Sidebar</span>
            <kbd>Ctrl+L</kbd> <span>Toggle Logs Panel</span>
            <kbd>Ctrl+/</kbd> <span>Show/Hide Shortcuts</span>
            <kbd>Esc</kbd> <span>Close Any Open Modal</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="action-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
