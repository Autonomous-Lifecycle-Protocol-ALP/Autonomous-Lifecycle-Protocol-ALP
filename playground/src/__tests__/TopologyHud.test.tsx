// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopologyHud } from '../components/TopologyHud';

describe('TopologyHud', () => {
  const metrics = {
    maxDepth: 3,
    maxParallel: 2,
    criticalPath: ['task-1', 'task-2', 'task-3'],
    bottlenecks: [{ id: 'task-1', type: 'task', score: 5 }],
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TopologyHud isOpen={false} onClose={vi.fn()} metrics={metrics} showCriticalPath={false} onToggleCriticalPath={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('displays metrics when isOpen is true', () => {
    render(
      <TopologyHud isOpen={true} onClose={vi.fn()} metrics={metrics} showCriticalPath={false} onToggleCriticalPath={vi.fn()} />
    );
    expect(screen.getByText('Topology & Critical Path Analytics')).toBeInTheDocument();
    expect(screen.getByText('DAG Max Depth')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Max Concurrency')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows critical path when provided', () => {
    render(
      <TopologyHud isOpen={true} onClose={vi.fn()} metrics={metrics} showCriticalPath={false} onToggleCriticalPath={vi.fn()} />
    );
    expect(screen.getByText('task-1 ➔ task-2 ➔ task-3')).toBeInTheDocument();
  });

  it('calls onToggleCriticalPath when button is clicked', () => {
    const onToggleCriticalPath = vi.fn();
    render(
      <TopologyHud isOpen={true} onClose={vi.fn()} metrics={metrics} showCriticalPath={false} onToggleCriticalPath={onToggleCriticalPath} />
    );
    fireEvent.click(screen.getByText('Highlight on Graph'));
    expect(onToggleCriticalPath).toHaveBeenCalled();
  });
});
