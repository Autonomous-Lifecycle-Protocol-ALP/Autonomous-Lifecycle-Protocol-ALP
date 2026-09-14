import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.js';
import { MultiModalEngine, AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { MultiModalBridge } from '@autonomous-lifecycle-protocol-alp/sdk';
import type { AlpMultimodal, AlpActionSpace, AlpVisionModel } from '@autonomous-lifecycle-protocol-alp/parser';
import { TabButton } from './shared.js';
import { OverviewTab } from './OverviewTab.js';
import { AssetsTab } from './AssetsTab.js';
import { ActionsTab } from './ActionsTab.js';
import { SimulatorTab } from './SimulatorTab.js';
import { SAMPLE_MULTIMODAL, SAMPLE_ACTION_SPACES, SAMPLE_VISION_MODELS } from './sampleData.js';
import { panelStyle, headerStyle, tabBarStyle, Tab } from './shared.js';

interface MultiModalPanelProps {
  parsedObjects?: AlpObject[] | null;
}

export function MultiModalPanel({ parsedObjects }: MultiModalPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const engine = useMemo(() => new MultiModalEngine(), []);
  const bridge = useMemo(() => new MultiModalBridge(), []);

  const { multimodalSpecs, actionSpaces, visionModels } = useMemo(() => {
    const objects = parsedObjects && parsedObjects.length > 0 ? parsedObjects : [];

    const mmFromParsed = objects.filter((o) => o._type === 'multimodal') as unknown as AlpMultimodal[];
    const asFromParsed = objects.filter((o) => o._type === 'action_space') as unknown as AlpActionSpace[];
    const vmFromParsed = objects.filter((o) => o._type === 'vision_model') as unknown as AlpVisionModel[];

    return {
      multimodalSpecs: mmFromParsed.length > 0 ? mmFromParsed : SAMPLE_MULTIMODAL,
      actionSpaces: asFromParsed.length > 0 ? asFromParsed : SAMPLE_ACTION_SPACES,
      visionModels: vmFromParsed.length > 0 ? vmFromParsed : SAMPLE_VISION_MODELS,
    };
  }, [parsedObjects]);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Icon name="camera" size={20} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>
            Multi-Modal & VLA Engine
          </div>
          <div style={{ fontSize: 10, color: '#8b949e' }}>
            v82.0.0 · Vision · Audio · Sensor · Action Space
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        <TabButton label="Overview" icon="📊" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton label="Assets" icon="📦" active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
        <TabButton label="Actions" icon="🎯" active={activeTab === 'actions'} onClick={() => setActiveTab('actions')} />
        <TabButton label="Simulator" icon="▶" active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} />
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          multimodalSpecs={multimodalSpecs}
          actionSpaces={actionSpaces}
          visionModels={visionModels}
          bridge={bridge}
        />
      )}
      {activeTab === 'assets' && <AssetsTab multimodalSpecs={multimodalSpecs} />}
      {activeTab === 'actions' && <ActionsTab actionSpaces={actionSpaces} engine={engine} />}
      {activeTab === 'simulator' && <SimulatorTab actionSpaces={actionSpaces} bridge={bridge} />}
    </div>
  );
}

export default MultiModalPanel;
