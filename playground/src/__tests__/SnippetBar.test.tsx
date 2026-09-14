// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SnippetBar } from '../components/SnippetBar';

describe('SnippetBar', () => {
  it('renders all snippet chips', () => {
    const onInsert = vi.fn();
    render(<SnippetBar onInsert={onInsert} />);
    expect(screen.getByText('Insert:')).toBeInTheDocument();
    expect(screen.getByText(/\+ @task/)).toBeInTheDocument();
    expect(screen.getByText(/\+ @agent/)).toBeInTheDocument();
    expect(screen.getByText(/\+ @feature/)).toBeInTheDocument();
    expect(screen.getByText(/\+ @workflow/)).toBeInTheDocument();
  });

  it('calls onInsert when a chip is clicked', () => {
    const onInsert = vi.fn();
    render(<SnippetBar onInsert={onInsert} />);
    fireEvent.click(screen.getByText(/\+ @task/));
    expect(onInsert).toHaveBeenCalledWith('task');
  });

  it('renders the "Insert:" label', () => {
    const onInsert = vi.fn();
    render(<SnippetBar onInsert={onInsert} />);
    expect(screen.getByText('Insert:')).toBeInTheDocument();
  });
});
