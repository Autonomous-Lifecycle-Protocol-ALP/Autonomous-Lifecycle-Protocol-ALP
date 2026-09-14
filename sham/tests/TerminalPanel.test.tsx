import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { TerminalPanel } from '../src/renderer/components/TerminalPanel.js';

vi.mock('../src/renderer/shared/alp-client.js', () => ({
  execTerminalCommand: vi.fn(),
}));

import { execTerminalCommand } from '../src/renderer/shared/alp-client.js';
const mockExec = vi.mocked(execTerminalCommand);

describe('TerminalPanel', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockExec.mockResolvedValue({ success: true, stdout: '', stderr: '' });
  });

  it('renders with empty state initially', () => {
    render(<TerminalPanel output={[]} onAppendOutput={vi.fn()} />);
    expect(screen.getByText(/Ready\. Type an ALP CLI command/i)).toBeInTheDocument();
  });

  it('displays terminal output when provided', () => {
    render(
      <TerminalPanel
        output={['line 1', 'line 2', 'line 3']}
        onAppendOutput={vi.fn()}
      />
    );
    expect(screen.getByText('line 1')).toBeInTheDocument();
    expect(screen.getByText('line 2')).toBeInTheDocument();
    expect(screen.getByText('line 3')).toBeInTheDocument();
  });

  it('accepts command input', () => {
    render(<TerminalPanel output={[]} onAppendOutput={vi.fn()} />);
    const [input] = screen.getAllByPlaceholderText('Type a command...');
    fireEvent.change(input, { target: { value: 'alp validate test.alp' } });
    expect(input).toHaveValue('alp validate test.alp');
  });

  it('styles error output differently', () => {
    render(
      <TerminalPanel
        output={['Normal output', 'Error: something failed']}
        onAppendOutput={vi.fn()}
      />
    );
    const errorLine = screen.getByText('Error: something failed');
    expect(errorLine).toBeInTheDocument();
    expect(errorLine.style.color).toBe('var(--accent-red)');
  });

  it('disables input during execution', async () => {
    let resolveCommand: (value: { success: boolean; stdout: string; stderr: string }) => void;
    mockExec.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCommand = resolve;
        })
    );

    const mockAppend = vi.fn();
    render(<TerminalPanel output={[]} onAppendOutput={mockAppend} />);

    const [input] = screen.getAllByPlaceholderText('Type a command...');
    const [button] = screen.getAllByRole('button', { name: /run/i });

    fireEvent.change(input, { target: { value: 'alp validate test.alp' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(input).toBeDisabled();
    });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Running...');

    resolveCommand!({ success: true, stdout: 'done', stderr: '' });

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('Run');
  });
});
