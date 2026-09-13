import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { PanelsDrawer } from '../src/renderer/components/PanelsDrawer';
import { ALL_PANELS } from '../src/renderer/app/shared';

afterEach(() => {
  cleanup();
});

describe('PanelsDrawer Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <PanelsDrawer
        isOpen={false}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByTestId('panels-drawer-overlay')).toBeNull();
  });

  it('renders correctly when isOpen is true with all 31 panels', () => {
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Panels & Workspaces')).toBeDefined();
    expect(screen.getByText(/Access all 31 specialized/i)).toBeDefined();
    expect(screen.getByText(`${ALL_PANELS.length} / ${ALL_PANELS.length} Available`)).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={onClose}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={onClose}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const overlay = screen.getByTestId('panels-drawer-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={onClose}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('filters panels when searching by text query', () => {
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const searchInput = screen.getByPlaceholderText(/Search panels/i);
    fireEvent.change(searchInput, { target: { value: 'debugger' } });

    expect(screen.getByText('Debugger')).toBeDefined();
    expect(screen.queryByText('Terminal')).toBeNull();
  });

  it('clears search when clear button is clicked', () => {
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const searchInput = screen.getByPlaceholderText(/Search panels/i);
    fireEvent.change(searchInput, { target: { value: 'copilot' } });
    expect(screen.getByText('Copilot')).toBeDefined();

    const clearBtn = screen.getByTitle('Clear search');
    fireEvent.click(clearBtn);

    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(screen.getByText('31 / 31 Available')).toBeDefined();
  });

  it('filters panels by category pill click', () => {
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const aiCategoryBtn = screen.getByRole('button', { name: /AI & Intelligence/i });
    fireEvent.click(aiCategoryBtn);

    expect(screen.getByText('Copilot')).toBeDefined();
    expect(screen.getByText('Intelligence')).toBeDefined();
    expect(screen.getByText('Autonomy')).toBeDefined();
    expect(screen.queryByText('Git Control')).toBeNull();
  });

  it('displays empty state when no panels match search and allows reset', () => {
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const searchInput = screen.getByPlaceholderText(/Search panels/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz-tool' } });

    expect(screen.getByText('No matching panels found')).toBeDefined();
    expect(screen.getByText(/No tools matched/i)).toBeDefined();

    const resetBtn = screen.getByRole('button', { name: /Reset Filters/i });
    fireEvent.click(resetBtn);

    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(screen.getByText('31 / 31 Available')).toBeDefined();
  });

  it('calls onSelectPanel and onClose when a panel card is clicked', () => {
    const onSelectPanel = vi.fn();
    const onClose = vi.fn();
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={onClose}
        activePanel="editor"
        onSelectPanel={onSelectPanel}
      />
    );
    const gitCard = screen.getByText('Git Control').closest('.panels-drawer-card');
    expect(gitCard).toBeDefined();
    fireEvent.click(gitCard!);

    expect(onSelectPanel).toHaveBeenCalledWith('git');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectPanel and onClose when Enter key is pressed on a card', () => {
    const onSelectPanel = vi.fn();
    const onClose = vi.fn();
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={onClose}
        activePanel="editor"
        onSelectPanel={onSelectPanel}
      />
    );
    const terminalCard = screen.getByText('Terminal').closest('.panels-drawer-card');
    expect(terminalCard).toBeDefined();
    fireEvent.keyDown(terminalCard!, { key: 'Enter' });

    expect(onSelectPanel).toHaveBeenCalledWith('terminal');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('highlights the currently active panel with active class and indicator', () => {
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const editorCard = screen.getByText('Editor').closest('.panels-drawer-card');
    expect(editorCard?.className).toContain('active');
  });
});
