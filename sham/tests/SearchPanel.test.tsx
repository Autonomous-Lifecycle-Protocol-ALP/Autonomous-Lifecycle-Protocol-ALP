import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SearchPanel } from '../src/renderer/components/SearchPanel';

afterEach(() => {
  cleanup();
});

describe('SearchPanel', () => {
  it('renders the Search title and input', () => {
    render(<SearchPanel onOpenFile={vi.fn()} />);
    expect(screen.getByText('Search')).toBeDefined();
    expect(screen.getByPlaceholderText('Search files, symbols, and references...')).toBeDefined();
  });

  it('renders search result count badge', () => {
    render(<SearchPanel onOpenFile={vi.fn()} />);
    expect(screen.getByText('5 results')).toBeDefined();
  });

  it('renders all mock search results', () => {
    render(<SearchPanel onOpenFile={vi.fn()} />);
    expect(screen.getAllByText('sham/src/renderer/App.tsx').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('sham/src/renderer/components/Sidebar.tsx')).toBeDefined();
    expect(screen.getByText('sham/src/renderer/components/EditorPanel.tsx')).toBeDefined();
    expect(screen.getByText('sham/src/renderer/components/TerminalPanel.tsx')).toBeDefined();
  });

  it('calls onOpenFile when a result is clicked', () => {
    const onOpenFile = vi.fn();
    render(<SearchPanel onOpenFile={onOpenFile} />);
    fireEvent.click(screen.getByText('sham/src/renderer/components/Sidebar.tsx'));
    expect(onOpenFile).toHaveBeenCalledWith('sham/src/renderer/components/Sidebar.tsx');
  });

  it('updates query state on input change', () => {
    render(<SearchPanel onOpenFile={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search files, symbols, and references...');
    fireEvent.change(input, { target: { value: 'react' } });
    expect(input).toHaveValue('react');
  });

  it('shows file type filter badges', () => {
    render(<SearchPanel onOpenFile={vi.fn()} />);
    expect(screen.getByText('*.ts')).toBeDefined();
    expect(screen.getByText('*.tsx')).toBeDefined();
    expect(screen.getByText('*.js')).toBeDefined();
    expect(screen.getByText('*.css')).toBeDefined();
  });
});
