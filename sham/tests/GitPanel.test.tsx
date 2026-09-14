import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { GitPanel } from '../src/renderer/components/GitPanel';

afterEach(() => {
  cleanup();
});

describe('GitPanel', () => {
  it('renders Source Control title', () => {
    render(<GitPanel />);
    expect(screen.getByText('Source Control')).toBeDefined();
  });

  it('renders Changes section with file list', () => {
    render(<GitPanel />);
    expect(screen.getByText('Changes')).toBeDefined();
    expect(screen.getByText('sham/src/main/index.ts')).toBeDefined();
    expect(screen.getByText('sham/src/renderer/App.tsx')).toBeDefined();
    expect(screen.getByText('docs/ROADMAP_V17_V43.md')).toBeDefined();
  });

  it('renders status badges for files', () => {
    render(<GitPanel />);
    expect(screen.getAllByText('modified').length).toBeGreaterThan(0);
    expect(screen.getAllByText('added').length).toBeGreaterThan(0);
  });

  it('renders commit message input with default value', () => {
    render(<GitPanel />);
    const input = screen.getByDisplayValue('feat: add v41 IDE productivity features');
    expect(input).toBeDefined();
  });

  it('renders branch info', () => {
    render(<GitPanel />);
    expect(screen.getByText('Branch:')).toBeDefined();
    expect(screen.getAllByText('main').length).toBeGreaterThanOrEqual(1);
  });

  it('renders repository info', () => {
    render(<GitPanel />);
    expect(screen.getByText('Repository')).toBeDefined();
    expect(screen.getByText('Remote')).toBeDefined();
    expect(screen.getByText('origin')).toBeDefined();
    expect(screen.getByText('URL')).toBeDefined();
  });

  it('updates commit message on change', () => {
    render(<GitPanel />);
    const input = screen.getByDisplayValue('feat: add v41 IDE productivity features');
    fireEvent.change(input, { target: { value: 'fix: resolve login bug' } });
    expect(input).toHaveValue('fix: resolve login bug');
  });

  it('renders Stage All and Commit buttons', () => {
    render(<GitPanel />);
    expect(screen.getByRole('button', { name: 'Stage All' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Commit' })).toBeDefined();
  });
});
