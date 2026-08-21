import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SnapshotsModal } from '../components/SnapshotsModal';

describe('SnapshotsModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SnapshotsModal isOpen={false} onClose={vi.fn()} snapshots={[]} onSave={vi.fn()} onLoad={vi.fn()} onDelete={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows empty state when snapshots is empty', () => {
    render(
      <SnapshotsModal isOpen={true} onClose={vi.fn()} snapshots={[]} onSave={vi.fn()} onLoad={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('No saved snapshots yet')).toBeInTheDocument();
  });

  it('renders snapshot list when snapshots are provided', () => {
    const snapshots = [
      { id: '1', name: 'Snapshot 1', code: 'line1\nline2', createdAt: '2026-08-22' },
      { id: '2', name: 'Snapshot 2', code: 'line1', createdAt: '2026-08-21' },
    ];
    render(
      <SnapshotsModal isOpen={true} onClose={vi.fn()} snapshots={snapshots} onSave={vi.fn()} onLoad={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('Snapshot 1')).toBeInTheDocument();
    expect(screen.getByText('Snapshot 2')).toBeInTheDocument();
  });

  it('calls onSave with the entered name', () => {
    const onSave = vi.fn();
    render(
      <SnapshotsModal isOpen={true} onClose={vi.fn()} snapshots={[]} onSave={onSave} onLoad={vi.fn()} onDelete={vi.fn()} />
    );
    const nameInput = screen.getByPlaceholderText('Snapshot name (e.g. Before refactoring)');
    fireEvent.change(nameInput, { target: { value: 'My Snapshot' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('My Snapshot');
  });
});
