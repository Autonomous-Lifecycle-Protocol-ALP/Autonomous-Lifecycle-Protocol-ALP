import { describe, it, expect } from 'vitest';
import { AnomalyDetector } from '../src/anomaly';
import { StoredEvent } from '../src/state-store';

function makeEvent(overrides: Partial<StoredEvent> = {}): StoredEvent {
  return {
    id: 'evt-1',
    type: 'task_status',
    status: '[x]',
    timestamp: Date.now(),
    ...overrides,
  } as StoredEvent;
}

describe('AnomalyDetector', () => {
  it('returns undefined when no anomalies present', () => {
    const events = [
      makeEvent({ type: 'task_status', status: '[x]' }),
      makeEvent({ type: 'task_status', status: '[x]' }),
    ];
    const detector = new AnomalyDetector(events);
    const result = detector.detect(makeEvent({ type: 'task_status', status: '[x]' }));
    expect(result).toBeUndefined();
  });

  it('detects failure spike with low z threshold', () => {
    const events = [
      makeEvent({ type: 'task_status', status: '[x]' }),
      makeEvent({ type: 'task_status', status: '[!]' }),
    ];
    const detector = new AnomalyDetector(events, 0.5);
    const result = detector.detect(makeEvent({ type: 'task_status', status: '[!]', agent: 'a1' }));
    expect(result?.anomalies).toContain('failure_spike');
  });

  it('detects handoff spike with low z threshold', () => {
    const events = [
      makeEvent({ type: 'task_status', status: '[x]' }),
      makeEvent({ type: 'task_status', status: '[x]' }),
    ];
    const detector = new AnomalyDetector(events, 0.5);
    const result = detector.detect(makeEvent({ type: 'human_handoff', agent: 'a1' }));
    expect(result?.anomalies).toContain('handoff_spike');
  });

  it('detects agent failure rate anomaly', () => {
    const events = [
      makeEvent({ type: 'task_status', status: '[!]', agent: 'a1' }),
      makeEvent({ type: 'workflow_fail', agent: 'a1' }),
      makeEvent({ type: 'task_status', status: '[x]', agent: 'a2' }),
    ];
    const detector = new AnomalyDetector(events, 0.5);
    const result = detector.detect(makeEvent({ type: 'task_status', status: '[!]', agent: 'a1' }));
    expect(result?.anomalies).toContain('agent_failure_rate');
  });

  it('uses custom z threshold', () => {
    const events = [
      makeEvent({ type: 'task_status', status: '[x]' }),
      makeEvent({ type: 'task_status', status: '[!]' }),
    ];
    const detector = new AnomalyDetector(events, 10);
    const result = detector.detect(makeEvent({ type: 'task_status', status: '[!]', agent: 'a1' }));
    expect(result).toBeUndefined();
  });
});
