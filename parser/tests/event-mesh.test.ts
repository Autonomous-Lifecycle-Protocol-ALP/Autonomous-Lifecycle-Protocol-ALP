import { describe, it, expect } from 'vitest';
import { AlpParser, EventMeshEngine, MeshEventType } from '../src/index';

function engineFrom() {
  return new EventMeshEngine();
}

describe('EventMeshEngine (v38.0.0)', () => {
  it('publishes an event and delivers to topic subscribers', () => {
    const engine = engineFrom();
    const received: MeshEvent[] = [];
    engine.subscribe('deploy', (e) => received.push(e));

    const evt = engine.publish('evt-1', 'deploy', 'agent-ci', 'deployed v1', 'state_change');

    expect(evt.id).toBe('evt-1');
    expect(evt.topic).toBe('deploy');
    expect(evt.senderAgent).toBe('agent-ci');
    expect(evt.eventType).toBe('state_change');
    expect(received).toHaveLength(1);
    expect(received[0].id).toBe('evt-1');
  });

  it('delivers events to wildcard subscribers', () => {
    const engine = engineFrom();
    const received: MeshEvent[] = [];
    engine.subscribe('*', (e) => received.push(e));

    engine.publish('evt-2', 'build', 'agent-ci', 'built', 'state_change');

    expect(received).toHaveLength(1);
    expect(received[0].topic).toBe('build');
  });

  it('does not deliver to subscribers of other topics', () => {
    const engine = engineFrom();
    const received: MeshEvent[] = [];
    engine.subscribe('deploy', (e) => received.push(e));

    engine.publish('evt-3', 'build', 'agent-ci', 'built', 'state_change');

    expect(received).toHaveLength(0);
  });

  it('supports unsubscribing', () => {
    const engine = engineFrom();
    const received: MeshEvent[] = [];
    const unsub = engine.subscribe('deploy', (e) => received.push(e));
    engine.publish('evt-4', 'deploy', 'agent-ci', 'deployed', 'state_change');
    expect(received).toHaveLength(1);

    unsub();
    engine.publish('evt-5', 'deploy', 'agent-ci', 'deployed again', 'state_change');
    expect(received).toHaveLength(1);
  });

  it('returns filtered event history by topic', () => {
    const engine = engineFrom();
    engine.publish('evt-a', 'build', 'a', 'payload', 'state_change');
    engine.publish('evt-b', 'deploy', 'b', 'payload', 'state_change');
    engine.publish('evt-c', 'build', 'c', 'payload', 'state_change');

    const buildHistory = engine.getEventHistory('build');
    expect(buildHistory).toHaveLength(2);
    expect(buildHistory.map((e) => e.id)).toEqual(['evt-a', 'evt-c']);

    const deployHistory = engine.getEventHistory('deploy');
    expect(deployHistory).toHaveLength(1);
    expect(deployHistory[0].id).toBe('evt-b');
  });

  it('returns full unbuffered history when topic is omitted', () => {
    const engine = engineFrom();
    engine.publish('evt-1', 'build', 'a', 'payload', 'state_change');
    engine.publish('evt-2', 'deploy', 'b', 'payload', 'state_change');

    expect(engine.getEventHistory()).toHaveLength(2);
  });

  it('clears the event buffer', () => {
    const engine = engineFrom();
    engine.publish('evt-1', 'build', 'a', 'payload', 'state_change');
    engine.clearBuffer();
    expect(engine.getEventHistory()).toHaveLength(0);
  });

  it('supports all MeshEventType values', () => {
    const types: MeshEventType[] = ['state_change', 'task_update', 'agent_broadcast', 'alert'];
    const engine = engineFrom();
    for (let i = 0; i < types.length; i++) {
      const received: MeshEvent[] = [];
      engine.subscribe('*', (e) => received.push(e));
      engine.publish(`evt-${i}`, 'global', 'a', 'payload', types[i]);
      expect(received[0].eventType).toBe(types[i]);
    }
  });
});
