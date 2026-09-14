import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CommandPalette } from '../src/renderer/components/CommandPalette';

afterEach(() => {
  cleanup();
});

describe('CommandPalette', () => {
  it('renders all command categories', () => {
    render(<CommandPalette onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getAllByText('File').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('View')).toBeDefined();
    expect(screen.getByText('Git')).toBeDefined();
    expect(screen.getByText('AI')).toBeDefined();
    expect(screen.getByText('Search')).toBeDefined();
  });

  it('renders the search input', () => {
    render(<CommandPalette onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeDefined();
  });

  it('filters commands by query', () => {
    render(<CommandPalette onClose={vi.fn()} onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'save' } });
    expect(screen.getAllByText('File: Save').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('File: New ALP File')).toBeNull();
  });

  it('shows no results message for unknown query', () => {
    render(<CommandPalette onClose={vi.fn()} onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a command or search...');
    fireEvent.change(input, { target: { value: 'xyznonexistent' } });
    expect(screen.getByText('No results found')).toBeDefined();
  });

  it('calls onSelect when a command is clicked', () => {
    const onSelect = vi.fn();
    render(<CommandPalette onClose={vi.fn()} onSelect={onSelect} />);
    fireEvent.click(screen.getAllByText('File: Save')[0]);
    expect(onSelect).toHaveBeenCalledWith('editor.save');
  });

  it('calls onClose when the overlay is clicked', () => {
    const onClose = vi.fn();
    render(<CommandPalette onClose={onClose} onSelect={vi.fn()} />);
    const overlay = screen.getAllByText('File')[0].closest('.modal-overlay')!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders keyboard shortcuts for commands that have them', () => {
    render(<CommandPalette onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getAllByText('Ctrl').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('S')).toBeDefined();
  });
});
