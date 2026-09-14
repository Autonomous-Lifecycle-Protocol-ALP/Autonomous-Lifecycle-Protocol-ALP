import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AgentPanel } from '../src/renderer/components/AgentPanel';
import type { ALPAgent } from '../src/renderer/shared/types';

afterEach(() => { cleanup(); });

describe('AgentPanel', () => {
  it('renders the Agent Manager title', () => {
    render(<AgentPanel agents={[]} onRunAgent={vi.fn()} />);
    expect(screen.getByText('Agent Manager')).toBeDefined();
  });

  it('shows empty state when no agents exist', () => {
    render(<AgentPanel agents={[]} onRunAgent={vi.fn()} />);
    expect(screen.getByText('No agents yet')).toBeDefined();
    expect(screen.getByText('Create an agent to get started with autonomous workflows.')).toBeDefined();
  });

  it('allows adding a new agent', () => {
    const onRunAgent = vi.fn();
    render(<AgentPanel agents={[]} onRunAgent={onRunAgent} />);
    const input = screen.getByPlaceholderText('New agent name...');
    fireEvent.change(input, { target: { value: 'Test Agent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onRunAgent).toHaveBeenCalledTimes(1);
    expect(onRunAgent.mock.calls[0][0]).toMatch(/^agent-\d+$/);
  });

  it('does not add an agent with an empty name', () => {
    const onRunAgent = vi.fn();
    render(<AgentPanel agents={[]} onRunAgent={onRunAgent} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onRunAgent).not.toHaveBeenCalled();
  });

  it('renders a Create button to open the agent creator dialog', () => {
    render(<AgentPanel agents={[]} onRunAgent={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Create' })).toBeDefined();
  });

  it('opens the AgentCreator dialog when Create is clicked', () => {
    render(<AgentPanel agents={[]} onRunAgent={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByPlaceholderText('Agent name...')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Create Agent' })).toBeDefined();
  });

  it('creates an agent via the dialog with full config', () => {
    const onCreateAgent = vi.fn();
    render(<AgentPanel agents={[]} onRunAgent={vi.fn()} onCreateAgent={onCreateAgent} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    const nameInput = screen.getByPlaceholderText('Agent name...');
    fireEvent.change(nameInput, { target: { value: 'Full Agent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Agent' }));
    expect(onCreateAgent).toHaveBeenCalledTimes(1);
    expect(onCreateAgent.mock.calls[0][0].name).toBe('Full Agent');
    expect(onCreateAgent.mock.calls[0][0].role).toBe('developer');
    expect(onCreateAgent.mock.calls[0][0].model).toBe('gpt-4o');
    expect(onCreateAgent.mock.calls[0][0].permissions).toEqual(['read', 'write']);
  });

  it('closes the dialog on Cancel', () => {
    render(<AgentPanel agents={[]} onRunAgent={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByPlaceholderText('Agent name...')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByPlaceholderText('Agent name...')).toBeNull();
  });

  it('renders a list of existing agents', () => {
    const agents: ALPAgent[] = [
      { id: 'agent-1', name: 'Alpha', status: 'idle', config: {} },
      { id: 'agent-2', name: 'Beta', status: 'running', config: {} },
    ];
    render(<AgentPanel agents={agents} onRunAgent={vi.fn()} />);
    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
    expect(screen.getByText('idle')).toBeDefined();
    expect(screen.getByText('running')).toBeDefined();
  });

  it('calls onRunAgent when Run is clicked on an agent', () => {
    const onRunAgent = vi.fn();
    const agents: ALPAgent[] = [
      { id: 'agent-1', name: 'Alpha', status: 'idle', config: {} },
    ];
    render(<AgentPanel agents={agents} onRunAgent={onRunAgent} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(onRunAgent).toHaveBeenCalledWith('agent-1', {});
  });

  it('renders Configure and Delete buttons for each agent', () => {
    const agents: ALPAgent[] = [
      { id: 'agent-1', name: 'Alpha', status: 'idle', config: {} },
    ];
    render(<AgentPanel agents={agents} onRunAgent={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Configure' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
  });
});