import React from 'react';

interface AssetItem {
  id: string;
  type: string;
  uri?: string;
}

interface AssetGridProps {
  assets: AssetItem[] | undefined;
}

export function AssetGrid({ assets }: AssetGridProps): React.JSX.Element | null {
  if (!assets || assets.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 10,
        padding: 8,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 6,
        fontSize: 11,
      }}
    >
      <span style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase' }}>Assets</span>
      {assets.map((asset) => (
        <div
          key={asset.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            color: '#cbd5e1',
          }}
        >
          <span>{asset.id}</span>
          <span style={{ color: '#00f0ff', fontFamily: 'JetBrains Mono' }}>
            {asset.type}{asset.uri ? ` → ${asset.uri}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
