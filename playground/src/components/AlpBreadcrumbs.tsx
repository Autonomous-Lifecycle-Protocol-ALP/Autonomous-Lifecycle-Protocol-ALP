import React, { useMemo } from 'react';

interface AlpBreadcrumbsProps {
  code: string;
  lineNumber: number;
}

interface BreadcrumbItem {
  type: string;
  id?: string;
  line: number;
}

export function AlpBreadcrumbs({ code, lineNumber }: AlpBreadcrumbsProps): React.JSX.Element | null {
  const crumbs = useMemo(() => {
    if (!code || lineNumber <= 0) return [];

    const lines = code.split('\n');
    const crumbs: BreadcrumbItem[] = [];

    for (let i = lineNumber - 1; i >= 0; i--) {
      const line = lines[i];
      const match = line.match(/^(\s*)@(\w+)(?:\s+(\S+))?/);
      if (match) {
        const indent = match[1];
        const type = match[2];
        const id = match[3];

        // Pop any breadcrumbs at deeper or equal indent level
        while (crumbs.length > 0 && crumbs[crumbs.length - 1].line >= i) {
          crumbs.pop();
        }

        crumbs.push({ type, id, line: i + 1 });

        // Stop when we hit a top-level block (no indent or minimal indent)
        if (indent.length === 0) {
          break;
        }
      }
    }

    return crumbs;
  }, [code, lineNumber]);

  if (crumbs.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        background: 'rgba(15, 23, 42, 0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
        color: '#94a3b8',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      {crumbs.map((crumb, index) => (
        <React.Fragment key={`${crumb.line}-${index}`}>
          {index > 0 && (
            <span style={{ color: '#475569', margin: '0 2px' }}>/</span>
          )}
          <span
            style={{
              color: '#00f0ff',
              fontWeight: 600,
            }}
          >
            @{crumb.type}
          </span>
          {crumb.id && (
            <span style={{ color: '#e2e8f0' }}>
              {crumb.id}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
