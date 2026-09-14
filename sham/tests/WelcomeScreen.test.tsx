import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WelcomeScreen } from '../src/renderer/components/WelcomeScreen';

describe('WelcomeScreen', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders branding', () => {
    render(<WelcomeScreen onOpenFile={vi.fn()} />);
    expect(screen.getByText('SHAM IDE')).toBeDefined();
    expect(screen.getByText('Smart Hosted Agent Manager')).toBeDefined();
  });

  it('Open Project button is present and clickable', () => {
    const onOpenFile = vi.fn();
    render(<WelcomeScreen onOpenFile={onOpenFile} />);
    const buttons = screen.getAllByRole('button', { name: 'Open Project' });
    buttons[0].click();
    expect(onOpenFile).toHaveBeenCalledWith('project.alp');
  });

  it('renders recent projects list if provided', () => {
    const recentProjects = ['/path/to/project1.alp', '/path/to/project2.alp'];
    render(<WelcomeScreen onOpenFile={vi.fn()} recentProjects={recentProjects} />);
    expect(screen.getByText('Recent Projects')).toBeDefined();
    expect(screen.getByText('/path/to/project1.alp')).toBeDefined();
    expect(screen.getByText('/path/to/project2.alp')).toBeDefined();
  });

  it('keyboard shortcut hints are displayed', () => {
    render(<WelcomeScreen onOpenFile={vi.fn()} />);
    expect(screen.getAllByText('Monaco Editor').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Integrated Terminal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MCP Browser').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Intelligence').length).toBeGreaterThan(0);
  });
});
