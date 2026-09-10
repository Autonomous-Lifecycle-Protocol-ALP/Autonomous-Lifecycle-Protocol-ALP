// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NodeInspector } from '../components/NodeInspector.js';
import type { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';

const mockObj: AlpObject = {
  _type: 'task',
  id: 'task-test',
  status: '[x]',
  description: 'A test task',
};

describe('NodeInspector', () => {
  it('renders nothing when not provided', () => {
    const { container } = render(
      <NodeInspector
        obj={mockObj}
        simStatus="[x]"
        isEditing={false}
        onClose={() => {}}
        onToggleEdit={() => {}}
        onSave={() => {}}
        onInjectFailure={() => {}}
      />
    );
    expect(container.querySelector('.inspector-panel')).toBeInTheDocument();
  });

  it('displays object fields in view mode', () => {
    render(
      <NodeInspector
        obj={mockObj}
        simStatus="[x]"
        isEditing={false}
        onClose={() => {}}
        onToggleEdit={() => {}}
        onSave={() => {}}
        onInjectFailure={() => {}}
      />
    );

    expect(screen.getByText('@task Details')).toBeInTheDocument();
    expect(screen.getByText('task-test')).toBeInTheDocument();
    expect(screen.getByText('A test task')).toBeInTheDocument();
  });

  it('shows edit form when isEditing is true', () => {
    render(
      <NodeInspector
        obj={mockObj}
        simStatus="[x]"
        isEditing={true}
        onClose={() => {}}
        onToggleEdit={() => {}}
        onSave={() => {}}
        onInjectFailure={() => {}}
      />
    );

    expect(screen.getByLabelText('ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('calls onSave with edited fields', () => {
    const onSave = vi.fn();
    render(
      <NodeInspector
        obj={mockObj}
        simStatus="[x]"
        isEditing={true}
        onClose={() => {}}
        onToggleEdit={() => {}}
        onSave={onSave}
        onInjectFailure={() => {}}
      />
    );

    const saveButton = screen.getByText('Save to Spec');
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith({
      id: 'task-test',
      status: '[x]',
      description: 'A test task',
    });
  });

  it('calls onInjectFailure when Simulate Failure is clicked', () => {
    const onInjectFailure = vi.fn();
    render(
      <NodeInspector
        obj={mockObj}
        simStatus="[x]"
        isEditing={false}
        onClose={() => {}}
        onToggleEdit={() => {}}
        onSave={() => {}}
        onInjectFailure={onInjectFailure}
      />
    );

    const button = screen.getByText('Simulate Failure');
    fireEvent.click(button);

    expect(onInjectFailure).toHaveBeenCalledWith('task-test');
  });
});
