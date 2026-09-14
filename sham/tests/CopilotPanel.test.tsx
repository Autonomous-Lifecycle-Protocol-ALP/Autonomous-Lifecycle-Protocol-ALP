import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CopilotPanel } from '../src/renderer/components/CopilotPanel';
import type { CopilotSuggestion, ALPDiagnostic } from '../src/renderer/shared/types';

const baseProps = {
  suggestions: [] as CopilotSuggestion[],
  output: [] as string[],
  diagnostics: [] as ALPDiagnostic[],
  onUpdateSuggestions: vi.fn(),
  onAppendOutput: vi.fn(),
};

afterEach(() => {
  cleanup();
});

describe('CopilotPanel', () => {
  it('renders the Agent Copilot header', () => {
    render(<CopilotPanel {...baseProps} />);
    expect(screen.getByText('Agent Copilot')).toBeDefined();
  });

  it('renders all tabs', () => {
    render(<CopilotPanel {...baseProps} />);
    expect(screen.getByText('Chat')).toBeDefined();
    expect(screen.getByText('Plan')).toBeDefined();
    expect(screen.getByText('NL Query')).toBeDefined();
    expect(screen.getByText('Suggestions')).toBeDefined();
  });

  it('shows empty state on the plan tab', () => {
    render(<CopilotPanel {...baseProps} />);
    fireEvent.click(screen.getByText('Plan'));
    expect(screen.getByText('No plan generated')).toBeDefined();
  });

  it('switches tabs when clicked', () => {
    render(<CopilotPanel {...baseProps} />);
    fireEvent.click(screen.getByText('NL Query'));
    expect(screen.getByText('Natural Language Workspace Query:')).toBeDefined();
  });

  it('shows empty state for suggestions when none exist', () => {
    render(<CopilotPanel {...baseProps} />);
    fireEvent.click(screen.getByText('Suggestions'));
    expect(screen.getByText('No suggestions')).toBeDefined();
  });

  it('renders suggestion cards when suggestions are provided', () => {
    const props = {
      ...baseProps,
      suggestions: [
        { id: 's-1', type: 'fix', message: 'Use async/await', severity: 'warning' },
        { id: 's-2', type: 'completion', message: 'Complete function body', severity: 'info' },
      ] as CopilotSuggestion[],
    };
    render(<CopilotPanel {...props} />);
    fireEvent.click(screen.getByText('Suggestions'));
    expect(screen.getByText('Use async/await')).toBeDefined();
    expect(screen.getByText('Complete function body')).toBeDefined();
  });

  it('filters suggestions by type', () => {
    const props = {
      ...baseProps,
      suggestions: [
        { id: 's-1', type: 'fix', message: 'Fix bug' },
        { id: 's-2', type: 'completion', message: 'Complete code' },
      ] as CopilotSuggestion[],
    };
    render(<CopilotPanel {...props} />);
    fireEvent.click(screen.getByText('Suggestions'));
    fireEvent.click(screen.getByText('Fix'));
    expect(screen.getByText('Fix bug')).toBeDefined();
    expect(screen.queryByText('Complete code')).toBeNull();
  });

  it('calls onAppendOutput when Classify & Plan is clicked', () => {
    const onAppendOutput = vi.fn();
    render(<CopilotPanel {...baseProps} onAppendOutput={onAppendOutput} />);
    const textarea = screen.getByPlaceholderText('e.g. "generate a TypeScript async API handler" or "fix the auth bug"');
    fireEvent.change(textarea, { target: { value: 'build a REST API' } });
    fireEvent.click(screen.getByText('Classify & Plan'));
    expect(onAppendOutput).toHaveBeenCalled();
    const callArgs = onAppendOutput.mock.calls[0][0] as string[];
    expect(callArgs.some((line) => line.includes('Intent:'))).toBe(true);
  });

  it('calls onAppendOutput when Search is clicked in query tab', () => {
    const onAppendOutput = vi.fn();
    render(<CopilotPanel {...baseProps} onAppendOutput={onAppendOutput} />);
    fireEvent.click(screen.getByText('NL Query'));
    const input = screen.getByPlaceholderText('e.g. "show all blocked tasks" or "find policies"');
    fireEvent.change(input, { target: { value: 'tasks' } });
    fireEvent.click(screen.getByText('Search'));
    expect(onAppendOutput).toHaveBeenCalled();
    const callArgs = onAppendOutput.mock.calls[0][0] as string[];
    expect(callArgs.some((line) => line.includes('Matched'))).toBe(true);
  });
});
