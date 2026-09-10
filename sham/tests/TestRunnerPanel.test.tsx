import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TestRunnerPanel } from '../src/renderer/components/TestRunnerPanel';
import type { TestSuite, TestCase } from '../src/renderer/shared/types';

afterEach(() => {
  cleanup();
});

const mockSuites: TestSuite[] = [
  {
    id: 'suite-1',
    name: 'Unit Tests',
    status: 'passed',
    tests: [
      { id: 't1', name: 'should validate agent', status: 'passed', durationMs: 12 },
      { id: 't2', name: 'should parse workflow', status: 'passed', durationMs: 8 },
    ],
  },
  {
    id: 'suite-2',
    name: 'Integration Tests',
    status: 'failed',
    tests: [
      { id: 't3', name: 'should deploy to cloud', status: 'failed', durationMs: 1200, error: 'Connection timeout' },
    ],
  },
];

describe('TestRunnerPanel', () => {
  it('renders Test Explorer title', () => {
    render(<TestRunnerPanel suites={[]} output={[]} onRunTests={vi.fn()} onAppendOutput={vi.fn()} />);
    expect(screen.getByText('Test Explorer')).toBeDefined();
  });

  it('shows empty state when no suites', () => {
    render(<TestRunnerPanel suites={[]} output={[]} onRunTests={vi.fn()} onAppendOutput={vi.fn()} />);
    expect(screen.getByText('No test suites')).toBeDefined();
    expect(screen.getByText('Run `alp test` to discover test suites.')).toBeDefined();
  });

  it('renders test suites with names and status badges', () => {
    render(<TestRunnerPanel suites={mockSuites} output={[]} onRunTests={vi.fn()} onAppendOutput={vi.fn()} />);
    expect(screen.getByText('Unit Tests')).toBeDefined();
    expect(screen.getByText('Integration Tests')).toBeDefined();
    expect(screen.getByText('passed')).toBeDefined();
    expect(screen.getByText('failed')).toBeDefined();
  });

  it('shows test counts in header badges', () => {
    render(<TestRunnerPanel suites={mockSuites} output={[]} onRunTests={vi.fn()} onAppendOutput={vi.fn()} />);
    expect(screen.getByText('3 tests')).toBeDefined();
    expect(screen.getByText('2 passed')).toBeDefined();
    expect(screen.getByText('1 failed')).toBeDefined();
  });

  it('expands suite to show individual tests on click', () => {
    render(<TestRunnerPanel suites={mockSuites} output={[]} onRunTests={vi.fn()} onAppendOutput={vi.fn()} />);
    fireEvent.click(screen.getByText('Unit Tests'));
    expect(screen.getByText('should validate agent')).toBeDefined();
    expect(screen.getByText('should parse workflow')).toBeDefined();
    expect(screen.getByText('12ms')).toBeDefined();
  });

  it('shows error message for failed tests', () => {
    render(<TestRunnerPanel suites={mockSuites} output={[]} onRunTests={vi.fn()} onAppendOutput={vi.fn()} />);
    fireEvent.click(screen.getByText('Integration Tests'));
    expect(screen.getByText('Connection timeout')).toBeDefined();
  });

  it('calls onRunTests when Run Tests button is clicked', () => {
    const onRunTests = vi.fn();
    render(<TestRunnerPanel suites={mockSuites} output={[]} onRunTests={onRunTests} onAppendOutput={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run Tests' }));
    expect(onRunTests).toHaveBeenCalledWith(['suite-1', 'suite-2']);
  });

  it('renders output panel when output exists', () => {
    render(<TestRunnerPanel suites={mockSuites} output={['Running suite-1...', 'All tests passed']} onRunTests={vi.fn()} onAppendOutput={vi.fn()} />);
    expect(screen.getByText('Running suite-1...')).toBeDefined();
    expect(screen.getByText('All tests passed')).toBeDefined();
  });

  it('shows placeholder when output is empty', () => {
    render(<TestRunnerPanel suites={mockSuites} output={[]} onRunTests={vi.fn()} onAppendOutput={vi.fn()} />);
    expect(screen.getByText('Run a test suite to see output here.')).toBeDefined();
  });
});
