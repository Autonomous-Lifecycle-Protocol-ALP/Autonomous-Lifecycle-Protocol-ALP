import React, { useState } from 'react';

interface TestCase {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  durationMs?: number;
  error?: string;
}

interface TestSuite {
  id: string;
  name: string;
  tests: TestCase[];
  status: 'pending' | 'running' | 'passed' | 'failed';
}

interface TestRunnerPanelProps {
  suites: TestSuite[];
  output: string[];
  onRunTests: (suiteIds: string[]) => void;
  onAppendOutput: (lines: string[]) => void;
}

export function TestRunnerPanel({ suites, output, onRunTests, onAppendOutput }: TestRunnerPanelProps): React.JSX.Element {
  const [selected, setSelected] = useState<string[]>([]);

  const totalTests = suites.reduce((acc, s) => acc + s.tests.length, 0);
  const passedTests = suites.reduce((acc, s) => acc + s.tests.filter((t) => t.status === 'passed').length, 0);
  const failedTests = suites.reduce((acc, s) => acc + s.tests.filter((t) => t.status === 'failed').length, 0);
  const runningTests = suites.reduce((acc, s) => acc + s.tests.filter((t) => t.status === 'running').length, 0);

  const toggleSuite = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="panel-container">
      <div style={{ padding: '4px 12px', background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, height: 32, flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Test Explorer</span>
        <div style={{ flex: 1 }} />
        <span className="badge badge-muted">{totalTests} tests</span>
        {passedTests > 0 && <span className="badge badge-success">{passedTests} passed</span>}
        {failedTests > 0 && <span className="badge badge-error">{failedTests} failed</span>}
        {runningTests > 0 && <span className="badge badge-info">{runningTests} running</span>}
        <button className="btn btn-primary btn-sm" onClick={() => onRunTests(selected.length > 0 ? selected : suites.map((s) => s.id))}>
          Run Tests
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        <div className="panel-split-sidebar" style={{ width: '40%', minWidth: 200, borderRight: '1px solid var(--border)', overflow: 'auto' }}>
          {suites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No test suites</div>
              <div className="empty-state-desc">Run `alp test` to discover test suites.</div>
            </div>
          ) : (
            suites.map((suite) => (
              <div key={suite.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <div
                  className="list-item"
                  onClick={() => toggleSuite(suite.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="list-item-icon" dangerouslySetInnerHTML={{ __html: selected.includes(suite.id) ? '&#9662;' : '&#9656;' }} />
                  <div className="list-item-content">
                    <div className="list-item-title">{suite.name}</div>
                    <div className="list-item-subtitle">
                      {suite.tests.filter((t) => t.status === 'passed').length}/{suite.tests.length} passed
                    </div>
                  </div>
                  <span
                    className="badge badge-responsive"
                    style={{
                      background:
                        suite.status === 'passed' ? 'rgba(166, 227, 161, 0.15)' :
                        suite.status === 'failed' ? 'rgba(243, 139, 168, 0.15)' :
                        suite.status === 'running' ? 'rgba(137, 180, 250, 0.15)' :
                        'rgba(108, 112, 134, 0.15)',
                      color:
                        suite.status === 'passed' ? 'var(--accent-green)' :
                        suite.status === 'failed' ? 'var(--accent-red)' :
                        suite.status === 'running' ? 'var(--accent)' :
                        'var(--text-muted)',
                    }}
                  >
                    {suite.status}
                  </span>
                </div>
                {selected.includes(suite.id) && (
                  <div style={{ paddingLeft: 24 }}>
                    {suite.tests.map((test) => (
                      <div key={test.id} className="list-item" style={{ padding: '4px 12px' }}>
                        <span
                          className="list-item-icon"
                          style={{
                            color:
                              test.status === 'passed' ? 'var(--accent-green)' :
                              test.status === 'failed' ? 'var(--accent-red)' :
                              test.status === 'running' ? 'var(--accent)' :
                              'var(--text-muted)',
                          }}
                        >
                          {test.status === 'passed' ? '&#10003;' : test.status === 'failed' ? '&#10007;' : test.status === 'running' ? '&#8635;' : '&#9675;'}
                        </span>
                        <div className="list-item-content">
                          <div className="list-item-title">{test.name}</div>
                          {test.durationMs !== undefined && (
                            <div className="list-item-subtitle">{test.durationMs}ms</div>
                          )}
                          {test.error && (
                            <div className="list-item-subtitle" style={{ color: 'var(--accent-red)' }}>{test.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div style={{ flex: 1, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-sm)', padding: 'var(--spacing-xs)', background: 'var(--bg-primary)', boxSizing: 'border-box' }}>
          {output.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>Run a test suite to see output here.</div>
          ) : (
            output.map((line, i) => (
              <div key={i} style={{ padding: '2px 0', color: 'var(--text-secondary)' }}>{line}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
