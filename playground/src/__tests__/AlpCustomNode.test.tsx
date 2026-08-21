import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AlpCustomNode } from '../components/AlpCustomNode';

vi.mock('reactflow', () => ({
  Handle: ({ type, position }: any) => (
    <div data-testid={`handle-${type}`} data-position={position} />
  ),
  Position: { Left: 'left', Right: 'right' },
}));

describe('AlpCustomNode', () => {
  it('renders node with correct type badge', () => {
    render(<AlpCustomNode data={{ id: 'test-id', type: 'task', status: '[ ]' }} selected={false} />);
    expect(screen.getByText('@task')).toBeInTheDocument();
    expect(screen.getByText('TSK')).toBeInTheDocument();
  });

  it('renders node with correct id', () => {
    render(<AlpCustomNode data={{ id: 'node-123', type: 'agent', status: '[ ]' }} selected={false} />);
    expect(screen.getByText('node-123')).toBeInTheDocument();
  });

  it('shows status badge based on status prop', () => {
    render(<AlpCustomNode data={{ id: 'test-id', type: 'task', status: '[x]' }} selected={false} />);
    expect(screen.getByText('done')).toBeInTheDocument();
  });

  it('shows critical path chip when isCriticalPath is true', () => {
    render(
      <AlpCustomNode
        data={{ id: 'test-id', type: 'task', status: '[ ]', isCriticalPath: true }}
        selected={false}
      />
    );
    expect(screen.getByText('CP')).toBeInTheDocument();
  });
});
