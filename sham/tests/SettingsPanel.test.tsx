import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { SettingsPanel } from '../src/renderer/components/SettingsPanel';

afterEach(() => {
  cleanup();
});

describe('SettingsPanel', () => {
  it('renders the Settings title', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders Appearance section with theme select', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('Appearance')).toBeDefined();
    expect(screen.getByText('Theme')).toBeDefined();
    expect(screen.getByText('Catppuccin (Default)')).toBeDefined();
  });

  it('renders Font Size and Tab Size controls', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('Font Size')).toBeDefined();
    expect(screen.getByText('Tab Size')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });

  it('renders Editor section toggles', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('Editor')).toBeDefined();
    expect(screen.getByText('Word Wrap')).toBeDefined();
    expect(screen.getByText('Show Minimap')).toBeDefined();
    expect(screen.getByText('Auto Save')).toBeDefined();
    expect(screen.getByText('Send Telemetry')).toBeDefined();
  });

  it('toggles settings on button click', () => {
    render(<SettingsPanel />);
    const wordWrapLabel = screen.getByText('Word Wrap');
    const formRow = wordWrapLabel.closest('.form-row-inline')!;
    const button = within(formRow).getByRole('button');
    expect(button.textContent).toBe('On');
    fireEvent.click(button);
    expect(button.textContent).toBe('Off');
  });

  it('renders ALP Configuration section', () => {
    render(<SettingsPanel />);
    fireEvent.click(screen.getByText('Swarm'));
    expect(screen.getByText('ALP Configuration')).toBeDefined();
    expect(screen.getByText('Default Agent Runtime')).toBeDefined();
    expect(screen.getByText('Local (Docker)')).toBeDefined();
  });

  it('renders About section with version info', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('About')).toBeDefined();
    expect(screen.getByText(/SHAM IDE/)).toBeDefined();
    expect(screen.getByText(/ALP Runtime/)).toBeDefined();
  });

  it('renders Catppuccin badge', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('Catppuccin')).toBeDefined();
  });
});
