import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { App } from '../src/renderer/app/index';

afterEach(() => {
  cleanup();
});

describe('Sidebar Layout Controls & User Friendliness Suite', () => {
  it('toggles primary sidebar using layout control button in header', () => {
    render(<App />);

    // Initially primary sidebar is visible
    expect(screen.getByText('PRIMARY SIDEBAR')).toBeDefined();

    // Click Primary Sidebar toggle in layout controls
    const toggleBtn = screen.getByTitle('Toggle Primary Sidebar (Ctrl+B)');
    fireEvent.click(toggleBtn);

    // Primary sidebar is now hidden
    expect(screen.queryByText('PRIMARY SIDEBAR')).toBeNull();

    // Reopen pill on the left edge should be visible
    const reopenPill = screen.getByTitle('Open Primary Sidebar (Ctrl+B)');
    expect(reopenPill).toBeDefined();

    // Clicking reopen pill restores primary sidebar
    fireEvent.click(reopenPill);
    expect(screen.getByText('PRIMARY SIDEBAR')).toBeDefined();
  });

  it('toggles secondary sidebar using layout control button in header and edge reopen pill', () => {
    render(<App />);

    // Initially secondary sidebar is closed
    expect(screen.queryByText('SECONDARY SIDEBAR')).toBeNull();

    // Right-edge reopen pill should be visible
    const rightPill = screen.getByTitle('Open Secondary Sidebar (Ctrl+Alt+B)');
    expect(rightPill).toBeDefined();

    // Click toggle in layout controls
    const toggleBtn = screen.getByTitle('Toggle Secondary Sidebar (Ctrl+Alt+B)');
    fireEvent.click(toggleBtn);

    // Secondary sidebar is now open
    expect(screen.getByText('SECONDARY SIDEBAR')).toBeDefined();

    // Close it using the collapse button inside the secondary sidebar
    const hideBtn = screen.getByTitle('Hide Secondary Sidebar (Ctrl+Alt+B)');
    fireEvent.click(hideBtn);
    expect(screen.queryByText('SECONDARY SIDEBAR')).toBeNull();

    // Clicking the right edge pill reopens it
    const restorePill = screen.getByTitle('Open Secondary Sidebar (Ctrl+Alt+B)');
    fireEvent.click(restorePill);
    expect(screen.getByText('SECONDARY SIDEBAR')).toBeDefined();
  });

  it('toggles Zen Mode on and off', () => {
    render(<App />);

    // Initially both sidebars can be displayed
    expect(screen.getByText('PRIMARY SIDEBAR')).toBeDefined();

    // Click Zen Mode toggle button
    const zenBtn = screen.getByTitle('Toggle Distraction-Free Zen Mode');
    fireEvent.click(zenBtn);

    // In Zen Mode, primary sidebar is hidden and floating exit pill appears
    expect(screen.queryByText('PRIMARY SIDEBAR')).toBeNull();
    const exitZenPill = screen.getByTitle('Exit Zen Mode (Distraction-Free)');
    expect(exitZenPill).toBeDefined();

    // Click exit pill to restore layout
    fireEvent.click(exitZenPill);
    expect(screen.getByText('PRIMARY SIDEBAR')).toBeDefined();
  });

  it('opens and closes the Keyboard Shortcuts Help modal', () => {
    render(<App />);

    // Initially modal is not visible
    expect(screen.queryByText('Keyboard Shortcuts & Quick Controls')).toBeNull();

    // Click help button in header
    const helpBtn = screen.getByTitle('Keyboard Shortcuts & Help (F1)');
    fireEvent.click(helpBtn);

    // Modal dialog is open
    expect(screen.getByText('Keyboard Shortcuts & Quick Controls')).toBeDefined();
    expect(screen.getByText('Toggle Primary Sidebar (Left)')).toBeDefined();
    expect(screen.getByText('Toggle Secondary Sidebar (Right)')).toBeDefined();

    // Filter shortcuts
    const searchInput = screen.getByPlaceholderText(/Search shortcuts/i);
    fireEvent.change(searchInput, { target: { value: 'zen' } });
    expect(screen.getByText('Toggle Distraction-Free Zen Mode')).toBeDefined();

    // Close modal
    const closeBtn = screen.getByTitle('Close (Escape)');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Keyboard Shortcuts & Quick Controls')).toBeNull();
  });

  it('toggles sidebars via status bar interactive items', () => {
    render(<App />);

    expect(screen.getByText('Primary: On')).toBeDefined();
    expect(screen.getByText('Secondary: Off')).toBeDefined();

    // Click Primary toggle in status bar
    fireEvent.click(screen.getByText('Primary: On'));
    expect(screen.getByText('Primary: Off')).toBeDefined();
    expect(screen.queryByText('PRIMARY SIDEBAR')).toBeNull();

    // Click Secondary toggle in status bar
    fireEvent.click(screen.getByText('Secondary: Off'));
    expect(screen.getByText('Secondary: On')).toBeDefined();
    expect(screen.getByText('SECONDARY SIDEBAR')).toBeDefined();
  });

  it('toggles secondary sidebar using Ctrl+Alt+B keyboard shortcut', () => {
    render(<App />);

    expect(screen.queryByText('SECONDARY SIDEBAR')).toBeNull();

    // Press Ctrl+Alt+B
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true, altKey: true });
    expect(screen.getByText('SECONDARY SIDEBAR')).toBeDefined();

    // Press again to close
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true, altKey: true });
    expect(screen.queryByText('SECONDARY SIDEBAR')).toBeNull();
  });
});
