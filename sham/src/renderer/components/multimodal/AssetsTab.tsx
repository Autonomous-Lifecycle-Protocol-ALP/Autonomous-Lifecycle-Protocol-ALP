import React, { useMemo } from 'react';
import { AlpMultimodal, MultiModalAsset } from '@autonomous-lifecycle-protocol-alp/parser';
import {
  SectionHeader,
  cardStyle,
  chipStyle,
  ASSET_TYPE_COLORS,
} from './shared.js';

export function AssetsTab({ multimodalSpecs }: { multimodalSpecs: AlpMultimodal[] }) {
  const allAssets = useMemo(() => {
    const assets: (MultiModalAsset & { parentId: string })[] = [];
    for (const mm of multimodalSpecs) {
      for (const a of mm.assets || []) {
        assets.push({ ...a, parentId: mm.id });
      }
    }
    return assets;
  }, [multimodalSpecs]);

  return (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
      <SectionHeader title="All Multimodal Assets" count={allAssets.length} />
      {allAssets.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8b949e', padding: 40 }}>
          No multimodal assets defined. Add <code>assets</code> to your <code>@multimodal</code> spec.
        </div>
      )}
      {allAssets.map((asset) => (
        <div key={`${asset.parentId}-${asset.id}`} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: ASSET_TYPE_COLORS[asset.type] || '#8b949e',
                  marginRight: 8,
                }}
              />
              {asset.id}
            </span>
            <span style={chipStyle(ASSET_TYPE_COLORS[asset.type] || '#8b949e')}>{asset.type}</span>
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', wordBreak: 'break-all', marginBottom: 4 }}>
            URI: {asset.uri}
          </div>
          {asset.resolution && (
            <div style={{ fontSize: 11, color: '#8b949e' }}>Resolution: {asset.resolution}</div>
          )}
          {asset.format && <div style={{ fontSize: 11, color: '#8b949e' }}>Format: {asset.format}</div>}
          <div style={{ fontSize: 10, color: '#484f58', marginTop: 4 }}>Parent: {asset.parentId}</div>
        </div>
      ))}
    </div>
  );
}

export default AssetsTab;
