import React, { Component } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleCopyError = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    if (!error) return;
    const text = `Error: ${error.message}\n\nStack:\n${error.stack}\n\nComponent Stack:\n${errorInfo || 'N/A'}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API unavailable; silently fail
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const title = this.props.fallbackTitle || 'Something went wrong';
      const message = this.props.fallbackMessage || 'An unexpected error occurred. Please try reloading the app.';

      return (
        <div style={styles.wrapper}>
          <style>{errorBoundaryCSS}</style>
          <div style={styles.panel}>
            <div style={styles.iconRow}>
              <span style={styles.icon}>⚠</span>
              <h2 style={styles.title}>{title}</h2>
            </div>
            <p style={styles.message}>{message}</p>
            {error && <p style={styles.errorText}>{error.message}</p>}
            <div style={styles.buttonRow}>
              <button style={styles.reloadBtn} onClick={() => window.location.reload()}>
                Reload App
              </button>
              <button style={styles.copyBtn} onClick={this.handleCopyError}>
                Copy Error
              </button>
            </div>
            {error && errorInfo && (
              <details style={styles.details}>
                <summary style={styles.summary}>Stack Trace</summary>
                <pre style={styles.stack}>
                  {error.stack}
                  {'\n\n'}
                  {errorInfo}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    background: 'var(--bg-dark, #090a10)',
    padding: '1.5rem',
  },
  panel: {
    background: 'var(--bg-panel, rgba(18, 20, 32, 0.95))',
    border: '1px solid var(--border-color-glow, rgba(0, 240, 255, 0.3))',
    borderRadius: 'var(--radius-lg, 16px)',
    boxShadow: 'var(--shadow-elevated, 0 12px 40px rgba(0,0,0,0.5)), 0 0 24px rgba(0,240,255,0.08)',
    padding: '2rem',
    maxWidth: '640px',
    width: '100%',
    color: 'var(--text-primary, #f0f4fd)',
    fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
  },
  iconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '0.75rem',
  },
  icon: {
    fontSize: '1.75rem',
    lineHeight: 1,
    color: 'var(--accent-amber, #f59e0b)',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary, #f0f4fd)',
  },
  message: {
    margin: '0 0 1rem',
    color: 'var(--text-secondary, #8a94b0)',
    lineHeight: 1.5,
  },
  errorText: {
    margin: '0 0 1rem',
    padding: '0.75rem',
    background: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    borderRadius: 'var(--radius-sm, 6px)',
    color: 'var(--accent-rose, #f43f5e)',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
    wordBreak: 'break-word',
  },
  buttonRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  reloadBtn: {
    padding: '0.5rem 1.25rem',
    border: 'none',
    borderRadius: 'var(--radius-sm, 6px)',
    background: 'linear-gradient(135deg, var(--accent-cyan, #00f0ff), var(--accent-blue, #3b82f6))',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  copyBtn: {
    padding: '0.5rem 1.25rem',
    border: '1px solid var(--border-color-glow, rgba(0, 240, 255, 0.3))',
    borderRadius: 'var(--radius-sm, 6px)',
    background: 'transparent',
    color: 'var(--accent-cyan, #00f0ff)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
    transition: 'transform 0.15s ease, background 0.15s ease',
  },
  details: {
    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
    borderRadius: 'var(--radius-sm, 6px)',
    overflow: 'hidden',
  },
  summary: {
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    background: 'var(--bg-card, #131625)',
    color: 'var(--text-secondary, #8a94b0)',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
    userSelect: 'none',
    listStyle: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stack: {
    margin: 0,
    padding: '0.75rem',
    background: 'var(--bg-dark, #090a10)',
    color: 'var(--text-muted, #555d78)',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '300px',
    overflowY: 'auto',
  },
};

const errorBoundaryCSS = `
  .eb-reload-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 16px rgba(0, 240, 255, 0.35);
  }
  .eb-copy-btn:hover {
    background: rgba(0, 240, 255, 0.08);
    transform: translateY(-1px);
  }
  details[open] summary::after {
    content: '▼';
    font-size: 0.65rem;
    margin-left: 0.5rem;
    opacity: 0.7;
  }
  details:not([open]) summary::after {
    content: '▶';
    font-size: 0.65rem;
    margin-left: 0.5rem;
    opacity: 0.7;
  }
`;
