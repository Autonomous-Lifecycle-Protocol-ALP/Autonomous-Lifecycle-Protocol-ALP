import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DebugPanel } from '../src/renderer/components/DebugPanel';
import type { DebugSession } from '../src/renderer/shared/types';

afterEach(() => {
  cleanup();
});

const mockSession: DebugSession = {
  id: 'session-1',
  name: 'Debug session-1',
  status: 'running',
  breakpoints: ['10', '25', '40'],
  callStack: [
    { name: 'main', file: 'src/index.ts', line: 10 },
    { name: 'processTask', file: 'src/agent.ts', line: 45 },
  ],
  variables: { x: 1, y: 'test' },
};

describe('DebugPanel', () => {
  it('renders Debug Console title', () => {
    render(<DebugPanel session={null} output={[]} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    expect(screen.getByText('Debug Console')).toBeDefined();
  });

  it('shows empty state when no session is active', () => {
    render(<DebugPanel session={null} output={[]} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    expect(screen.getByText('No debug session')).toBeDefined();
    expect(screen.getByText('Open an ALP file and click Start Debugging to attach the debugger.')).toBeDefined();
  });

  it('shows Start Debugging button when session is null', () => {
    render(<DebugPanel session={null} output={[]} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Start Debugging' })).toBeDefined();
  });

  it('calls onStartDebug when Start Debugging is clicked', () => {
    const onStartDebug = vi.fn();
    render(<DebugPanel session={null} output={[]} onAppendOutput={vi.fn()} onStartDebug={onStartDebug} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Debugging' }));
    expect(onStartDebug).toHaveBeenCalledWith('active-file');
  });

  it('shows Stop button when session is running', () => {
    render(<DebugPanel session={mockSession} output={[]} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDefined();
  });

  it('renders breakpoints list', () => {
    render(<DebugPanel session={mockSession} output={[]} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    expect(screen.getByText('Breakpoints')).toBeDefined();
    expect(screen.getByText('Line 10')).toBeDefined();
    expect(screen.getByText('Line 25')).toBeDefined();
    expect(screen.getByText('Line 40')).toBeDefined();
  });

  it('renders call stack', () => {
    render(<DebugPanel session={mockSession} output={[]} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    expect(screen.getByText('Call Stack')).toBeDefined();
    expect(screen.getByText('main')).toBeDefined();
    expect(screen.getByText('processTask')).toBeDefined();
  });

  it('calls onToggleBreakpoint when a breakpoint is clicked', () => {
    const onToggleBreakpoint = vi.fn();
    render(<DebugPanel session={mockSession} output={[]} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={onToggleBreakpoint} />);
    fireEvent.click(screen.getByText('Line 10'));
    expect(onToggleBreakpoint).toHaveBeenCalledWith(10);
  });

  it('renders output lines', () => {
    render(<DebugPanel session={mockSession} output={['> breakpoint hit', 'x = 1']} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    expect(screen.getByText('> breakpoint hit')).toBeDefined();
    expect(screen.getByText('x = 1')).toBeDefined();
  });

  it('shows No active stack when call stack is empty', () => {
    const emptySession: DebugSession = { ...mockSession, callStack: [] };
    render(<DebugPanel session={emptySession} output={[]} onAppendOutput={vi.fn()} onStartDebug={vi.fn()} onStopDebug={vi.fn()} onToggleBreakpoint={vi.fn()} />);
    expect(screen.getByText('No active stack')).toBeDefined();
  });
});
