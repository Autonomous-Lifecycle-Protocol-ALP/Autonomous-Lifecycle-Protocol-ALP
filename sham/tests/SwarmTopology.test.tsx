import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SwarmTopology } from '../src/renderer/components/SwarmTopology';

vi.mock('../src/renderer/components/Icon.js', () => ({
  Icon: ({ name, size, color, className, style }: any) => (
    <span data-testid="mock-icon" className={className} style={style}>
      {name}
    </span>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('Swarm Topology', () => {
  it('renders the topology container', () => {
    render(<SwarmTopology />);
    expect(screen.getByTestId('swarm-topology')).toBeDefined();
  });

  it('renders swarm node cards for all agents', () => {
    render(<SwarmTopology />);
    expect(screen.getByTestId('swarm-node-coordinator')).toBeDefined();
    expect(screen.getByTestId('swarm-node-hello')).toBeDefined();
    expect(screen.getByTestId('swarm-node-analyst')).toBeDefined();
    expect(screen.getByTestId('swarm-node-sentinel')).toBeDefined();
  });

  it('renders node names', () => {
    render(<SwarmTopology />);
    expect(screen.getByText('swarm_coordinator')).toBeDefined();
    expect(screen.getByText('hello_agent')).toBeDefined();
    expect(screen.getByText('analyst_agent')).toBeDefined();
    expect(screen.getByText('sentinel_agent')).toBeDefined();
  });

  it('renders node metrics including memory and BFT consensus', () => {
    render(<SwarmTopology />);
    expect(screen.getByText('128MB')).toBeDefined();
    expect(screen.getByText('64MB')).toBeDefined();
    expect(screen.getByText('Leader')).toBeDefined();
    expect(screen.getAllByText('Follower').length).toBeGreaterThan(0);
  });

  it('renders Ping and Chaos buttons for each node', () => {
    render(<SwarmTopology />);
    expect(screen.getByTestId('ping-coordinator')).toBeDefined();
    expect(screen.getByTestId('chaos-coordinator')).toBeDefined();
    expect(screen.getByTestId('ping-hello')).toBeDefined();
    expect(screen.getByTestId('chaos-hello')).toBeDefined();
    expect(screen.getByTestId('ping-analyst')).toBeDefined();
    expect(screen.getByTestId('chaos-analyst')).toBeDefined();
    expect(screen.getByTestId('ping-sentinel')).toBeDefined();
    expect(screen.getByTestId('chaos-sentinel')).toBeDefined();
  });

  it('renders edge lines in the SVG', () => {
    render(<SwarmTopology />);
    const svg = screen.getByTestId('swarm-topology').querySelector('.swarm-edge-svg');
    expect(svg).toBeDefined();
    const lines = svg?.querySelectorAll('line');
    expect(lines && lines.length > 0).toBe(true);
  });

  it('renders consensus edges with special styling', () => {
    render(<SwarmTopology />);
    const svg = screen.getByTestId('swarm-topology').querySelector('.swarm-edge-svg');
    expect(svg).toBeDefined();
    const consensusLines = svg?.querySelectorAll('line.consensus');
    expect(consensusLines && consensusLines.length > 0).toBe(true);
  });

  it('selects a node on click', () => {
    render(<SwarmTopology />);
    const node = screen.getByTestId('swarm-node-coordinator');
    fireEvent.click(node);
    // Node inspector should appear after selection
    expect(screen.getByTestId('swarm-node-inspector')).toBeDefined();
    expect(screen.getByText(/swarm_coordinator.*Inspector/)).toBeDefined();
  });

  it('shows node inspector with full metrics when a node is selected', () => {
    render(<SwarmTopology />);
    const node = screen.getByTestId('swarm-node-coordinator');
    fireEvent.click(node);

    const inspector = screen.getByTestId('swarm-node-inspector');
    expect(inspector).toHaveTextContent('Status');
    expect(inspector).toHaveTextContent('Role');
    expect(inspector).toHaveTextContent('Memory');
    expect(inspector).toHaveTextContent('Throughput');
    expect(inspector).toHaveTextContent('Consensus');
    expect(inspector).toHaveTextContent('Uptime');
  });

  it('triggers ping log when Ping button is clicked', () => {
    render(<SwarmTopology />);
    const pingBtn = screen.getByTestId('ping-coordinator');
    fireEvent.click(pingBtn);

    expect(screen.getByText(/PING → coordinator/)).toBeDefined();
    expect(screen.getByText(/200 OK/)).toBeDefined();
  });

  it('triggers chaos log and toggles node status when Chaos button is clicked', () => {
    render(<SwarmTopology />);
    const chaosBtn = screen.getByTestId('chaos-coordinator');
    fireEvent.click(chaosBtn);

    expect(screen.getByText(/CHAOS → coordinator/)).toBeDefined();
    expect(screen.getByText(/Partition toggled/)).toBeDefined();
  });

  it('renders heartbeat event log after interactions', () => {
    render(<SwarmTopology />);
    // No log initially
    const container = screen.getByTestId('swarm-topology');
    expect(container.querySelector('.swarm-node-inspector')).toBeNull();

    // Click ping to trigger an event
    const pingBtn = screen.getByTestId('ping-hello');
    fireEvent.click(pingBtn);

    expect(screen.getByText(/Swarm Event Log/)).toBeDefined();
  });

  it('deselects node on second click', () => {
    render(<SwarmTopology />);
    const node = screen.getByTestId('swarm-node-coordinator');

    // First click selects
    fireEvent.click(node);
    expect(screen.getByTestId('swarm-node-inspector')).toBeDefined();

    // Second click deselects
    fireEvent.click(node);
    expect(screen.queryByTestId('swarm-node-inspector')).toBeNull();
  });

  it('renders status dots with correct classes', () => {
    render(<SwarmTopology />);
    const onlineDot = screen.getByTestId('swarm-node-coordinator').querySelector('.swarm-node-status-dot.online');
    const warningDot = screen.getByTestId('swarm-node-analyst').querySelector('.swarm-node-status-dot.warning');
    expect(onlineDot).toBeDefined();
    expect(warningDot).toBeDefined();
  });
});
