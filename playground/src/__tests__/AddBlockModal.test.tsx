import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddBlockModal } from '../components/AddBlockModal';

describe('AddBlockModal', () => {
  it('renders nothing when isOpen is false', () => {
    const onCreate = vi.fn();
    const { container } = render(<AddBlockModal isOpen={false} onClose={vi.fn()} onCreate={onCreate} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders form fields when isOpen is true', () => {
    const onCreate = vi.fn();
    render(<AddBlockModal isOpen={true} onClose={vi.fn()} onCreate={onCreate} />);
    expect(screen.getByText('Create New ALP Primitive')).toBeInTheDocument();
    expect(screen.getByText('Primitive Type')).toBeInTheDocument();
    expect(screen.getByText('ID (e.g. task-auth-service)')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Owner Agent (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Dependencies (Comma-separated IDs)')).toBeInTheDocument();
  });

  it('calls onCreate with form data when create button is clicked', () => {
    const onCreate = vi.fn();
    render(<AddBlockModal isOpen={true} onClose={vi.fn()} onCreate={onCreate} />);

    const idInput = screen.getByPlaceholderText('my-object-id');
    const descInput = screen.getByPlaceholderText('Brief summary of this primitive');
    const ownerInput = screen.getByPlaceholderText('@agent-coder');
    const dependsInput = screen.getByPlaceholderText('task-db-schema, task-core');

    fireEvent.change(idInput, { target: { value: 'my-new-block' } });
    fireEvent.change(descInput, { target: { value: 'A test block' } });
    fireEvent.change(ownerInput, { target: { value: '@agent-test' } });
    fireEvent.change(dependsInput, { target: { value: 'dep-1, dep-2' } });

    fireEvent.click(screen.getByText('Insert into Spec'));

    expect(onCreate).toHaveBeenCalledWith({
      type: 'task',
      id: 'my-new-block',
      description: 'A test block',
      owner: '@agent-test',
      dependsOn: 'dep-1, dep-2',
    });
  });

  it('does not call onCreate when ID is empty', () => {
    const onCreate = vi.fn();
    render(<AddBlockModal isOpen={true} onClose={vi.fn()} onCreate={onCreate} />);

    fireEvent.click(screen.getByText('Insert into Spec'));
    expect(onCreate).not.toHaveBeenCalled();
  });
});
