import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { PanelsDrawer } from '../src/renderer/components/PanelsDrawer';
import { App } from '../src/renderer/app/index';
import { Sidebar } from '../src/renderer/components/Sidebar';
import { defaultState } from '../src/renderer/app/shared';

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
  });

  it('renders all 31 panels when isOpen is true', () => {
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
    expect(screen.getByText(/31 \/ 31 Available/)).toBeDefined();
  });

  it('filters panels when searching', () => {
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const searchInput = screen.getByPlaceholderText(/Search panels/i);
    fireEvent.change(searchInput, { target: { value: 'debug' } });

    // Both Debugger and Edge Debug should be visible (both contain 'debug' in label or description)
    expect(screen.getByText('Debugger')).toBeDefined();
    expect(screen.getByText('Edge Debug')).toBeDefined();
    // Marketplace should be filtered out
    expect(screen.queryByText('Marketplace')).toBeNull();
  });

  it('shows empty state when search query matches nothing', () => {
    render(
      <PanelsDrawer
        isOpen={true}
        onClose={vi.fn()}
        activePanel="editor"
        onSelectPanel={vi.fn()}
      />
    );
    const searchInput = screen.getByPlaceholderText(/Search panels/i);
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } });

    expect(screen.getByText('No matching panels found')).toBeDefined();
  });

  it('filters by category pills', () => {
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

    expect(screen.getByText('Agents')).toBeDefined();
    expect(screen.getByText('Copilot')).toBeDefined();
    expect(screen.getByText('Synapse Graph')).toBeDefined();
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

    const testRunnerCards = screen.getAllByText('Test Runner');
    fireEvent.click(testRunnerCards[0]);

    expect(onSelectPanel).toHaveBeenCalledWith('test-runner');
    expect(onClose).toHaveBeenCalled();
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
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('App Navbar Drawers & Interactions', () => {
  it('opens and closes the Panels Drawer from navbar', () => {
    render(<App />);

    // Initially drawer is closed
    expect(screen.queryByRole('dialog')).toBeNull();

    // Click Panels Drawer button in navbar
    const panelsDrawerBtn = screen.getByTitle(/Panels & Workspaces Drawer/i);
    fireEvent.click(panelsDrawerBtn);

    // Dialog is now open
    expect(screen.getByRole('dialog')).toBeDefined();

    // Select a panel from the drawer card (find the card-title inside the drawer)
    const dialog = screen.getByRole('dialog');
    const cardTitles = dialog.querySelectorAll('.panels-drawer-card-title');
    const profilerCard = Array.from(cardTitles).find((el) => el.textContent === 'Profiler');
    expect(profilerCard).toBeDefined();
    fireEvent.click(profilerCard!.closest('.panels-drawer-card')!);

    // Drawer is closed after selecting a panel
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('toggles sidebar visibility when clicking sidebar toggle button in navbar', () => {
    render(<App />);

    // Sidebar is initially visible
    expect(screen.getByText('Workspace')).toBeDefined();

    // Click sidebar toggle in navbar
    const toggleBtn = screen.getByLabelText('Toggle Sidebar');
    fireEvent.click(toggleBtn);

    // Sidebar is hidden
    expect(screen.queryByText('Workspace')).toBeNull();

    // Click again to restore
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Workspace')).toBeDefined();
  });

  it('toggles bottom panel drawer when clicking terminal toggle in navbar', () => {
    render(<App />);

    // Bottom panel is initially open with Terminal tab
    const bottomTabBtns = screen.getAllByRole('button', { name: /^Terminal$/i });
    // There should be a bottom panel tab labeled 'Terminal'
    const bottomPanelTab = bottomTabBtns.find(
      (btn) => btn.classList.contains('bottom-panel-tab')
    );
    expect(bottomPanelTab).toBeDefined();

    // Click bottom panel toggle in navbar to close it
    const toggleBottomBtn = screen.getByLabelText('Toggle Bottom Panel');
    fireEvent.click(toggleBottomBtn);

    // Bottom panel tab should no longer be visible
    const bottomTabBtnsAfter = screen.queryAllByRole('button').filter(
      (btn) => btn.classList.contains('bottom-panel-tab')
    );
    expect(bottomTabBtnsAfter.length).toBe(0);

    // Click again to reopen
    fireEvent.click(toggleBottomBtn);
    const bottomTabBtnsReopened = screen.queryAllByRole('button').filter(
      (btn) => btn.classList.contains('bottom-panel-tab')
    );
    expect(bottomTabBtnsReopened.length).toBeGreaterThan(0);
  });
});

describe('Sidebar Workspace Filtering & Drawer Launcher', () => {
  it('launches panels drawer from sidebar footer launcher button', () => {
    const onOpenPanelsDrawer = vi.fn();
    render(
      <Sidebar
        state={defaultState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        onSelectAgent={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
        onOpenPanelsDrawer={onOpenPanelsDrawer}
      />
    );

    const launcherBtn = screen.getByTitle(/Open All Panels & Tools Drawer/i);
    fireEvent.click(launcherBtn);
    expect(onOpenPanelsDrawer).toHaveBeenCalled();
  });

  it('filters workspace tree files using the search input', () => {
    render(
      <Sidebar
        state={defaultState}
        onOpenFile={vi.fn()}
        onCloseFile={vi.fn()}
        onSelectAgent={vi.fn()}
        activePanel="editor"
        setActivePanel={vi.fn()}
      />
    );

    // Click workspace search toggle button
    const searchToggleBtn = screen.getByTitle('Filter Workspace Files');
    fireEvent.click(searchToggleBtn);

    const filterInput = screen.getByPlaceholderText('Filter files...');
    fireEvent.change(filterInput, { target: { value: 'hello' } });

    // hello.alp should be visible
    expect(screen.getByText('hello.alp')).toBeDefined();
    // README.md should be filtered out
    expect(screen.queryByText('README.md')).toBeNull();
  });
});
