import { describe, it, expect } from 'vitest';
import { GoalDecomposer, Planner, Reflector, Plan, PlanNode, Lesson, ReasoningTracer, ReasoningChain, ReasoningStep, CollabPlanner, AgentContribution, CollabPlanResult, ImprovementProposal } from '../src/planner';

describe('GoalDecomposer', () => {
  it('decomposes a goal into a plan', () => {
    const gd = new GoalDecomposer();
    const plan = gd.decompose('Build and test and deploy');
    expect(plan).toBeInstanceOf(Plan);
    expect(plan.nodes.length).toBeGreaterThanOrEqual(1);
  });

  it('throws on empty goal', () => {
    const gd = new GoalDecomposer();
    expect(() => gd.decompose('')).toThrow('Goal must not be empty.');
  });

  it('round-trips through toWorkflow', () => {
    const gd = new GoalDecomposer();
    const plan = gd.decompose('Ship feature X');
    const wf = gd.toWorkflow(plan);
    expect(wf.plan_id).toBe(plan.plan_id);
    expect(wf.goal).toBe('Ship feature X');
  });
});

describe('Planner', () => {
  const fakeEstimator = {
    estimate: () => ({ failure_risk: 0.1, confidence: 'high' }),
  };

  it('ranks plans by composite score', () => {
    const planner = new Planner();
    const p1 = new Plan('p1', 'Goal A', [new PlanNode('s1', 'task', 'A')]);
    const p2 = new Plan('p2', 'Goal B', [
      new PlanNode('s1', 'task', 'B'),
      new PlanNode('s2', 'task', 'C', ['s1']),
    ]);
    const ranked = planner.rank([p1, p2]);
    expect(ranked.length).toBe(2);
    expect(ranked[0].plan.plan_id).toBe('p1');
  });

  it('uses estimator when provided', () => {
    const planner = new Planner(fakeEstimator);
    const p1 = new Plan('p1', 'Goal A', [new PlanNode('s1', 'task', 'A')]);
    const ranked = planner.rank([p1]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].score.confidence).toBe('high');
  });

  it('score contains expected fields', () => {
    const planner = new Planner();
    const p = new Plan('p1', 'Goal', [new PlanNode('s1', 'task', 'A')]);
    const ranked = planner.rank([p]);
    const score = ranked[0].score;
    expect(score).toHaveProperty('composite');
    expect(score).toHaveProperty('risk');
    expect(score).toHaveProperty('depth');
  });
});

describe('Reflector', () => {
  const events = [
    { type: 'task_status', task_id: 't1', status: '[!]', timestamp: '2026-01-01T00:00:00Z' },
    { type: 'task_status', task_id: 't1', status: '[!]', timestamp: '2026-01-01T00:00:01Z' },
    { type: 'task_claim', task_id: 't1', timestamp: '2026-01-01T00:00:02Z' },
    { type: 'human_handoff', task_id: 't1', status: '[?]', timestamp: '2026-01-01T00:00:03Z' },
    { type: 'human_handoff', task_id: 't2', status: '[?]', timestamp: '2026-01-01T00:00:04Z' },
  ];

  it('detects failure patterns', () => {
    const ref = new Reflector(events);
    const lessons = ref.reflect('run-1');
    const failure = lessons.filter((l) => l.insight.includes('failed'));
    expect(failure.length).toBeGreaterThanOrEqual(1);
  });

  it('detects handoff patterns', () => {
    const ref = new Reflector(events);
    const lessons = ref.reflect('run-1');
    const handoffs = lessons.filter((l) => l.insight.includes('handoffs'));
    expect(handoffs.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty for no events', () => {
    const ref = new Reflector([]);
    expect(ref.reflect('run-1')).toEqual([]);
  });

  it('generates improvement proposals from lessons', () => {
    const ref = new Reflector([
      { type: 'task_status', task_id: 't1', status: '[!]', timestamp: '2026-01-01T00:00:00Z' },
      { type: 'task_status', task_id: 't1', status: '[!]', timestamp: '2026-01-01T00:00:01Z' },
      { type: 'task_claim', task_id: 't1', timestamp: '2026-01-01T00:00:02Z' },
      { type: 'human_handoff', task_id: 't1', status: '[?]', timestamp: '2026-01-01T00:00:03Z' },
      { type: 'human_handoff', task_id: 't2', status: '[?]', timestamp: '2026-01-01T00:00:04Z' },
    ]);
    const plan = new Plan('p1', 'Goal', [new PlanNode('t1', 'task', 'A')]);
    const result = ref.improvePlan(plan, ref.reflect('run-1'));
    expect(result.proposals.length).toBeGreaterThanOrEqual(2);
    expect(result.plan.nodes.length).toBeGreaterThanOrEqual(1);
    expect(result.plan.metadata.improvements).toBeDefined();
  });

  it('adds automation node for handoff lessons', () => {
    const ref = new Reflector([
      { type: 'human_handoff', task_id: 't1', status: '[?]', timestamp: '2026-01-01T00:00:03Z' },
      { type: 'human_handoff', task_id: 't2', status: '[?]', timestamp: '2026-01-01T00:00:04Z' },
    ]);
    const plan = new Plan('p1', 'Goal', []);
    const result = ref.improvePlan(plan, ref.reflect('run-1'));
    const hasAutomation = result.plan.nodes.some((n) => n.label.includes('automation'));
    expect(hasAutomation).toBe(true);
  });
});

describe('ReasoningTracer', () => {
  it('creates a reasoning chain', () => {
    const tracer = new ReasoningTracer();
    const chain = tracer.createChain('Ship feature X');
    expect(chain.chain_id).toBeTruthy();
    expect(chain.status).toBe('draft');
    expect(chain.steps).toHaveLength(0);
  });

  it('adds steps to a chain and transitions to executing', () => {
    const tracer = new ReasoningTracer();
    const chain = tracer.createChain('Ship feature X');
    const step = tracer.addStep(chain.chain_id, {
      agent_id: 'agent-1',
      thought: 'Need to build first',
      action: 'build',
      confidence: 0.9,
      dependencies: [],
    });
    expect(step.step_id).toBeTruthy();
    expect(step.timestamp).toBeTruthy();
    const reloaded = tracer.getChain(chain.chain_id);
    expect(reloaded?.status).toBe('executing');
    expect(reloaded?.steps).toHaveLength(1);
    expect(reloaded?.steps[0].agent_id).toBe('agent-1');
  });

  it('links dependent steps across agent boundaries', () => {
    const tracer = new ReasoningTracer();
    const chain = tracer.createChain('Ship feature X');
    const s1 = tracer.addStep(chain.chain_id, {
      agent_id: 'agent-planner',
      thought: 'Plan the build',
      action: 'plan',
      confidence: 0.95,
      dependencies: [],
    });
    const s2 = tracer.addStep(chain.chain_id, {
      agent_id: 'agent-builder',
      thought: 'Execute the build',
      action: 'build',
      observation: 'Build succeeded',
      confidence: 0.8,
      dependencies: [s1.step_id],
    });
    expect(s2.dependencies).toEqual([s1.step_id]);
    const reloaded = tracer.getChain(chain.chain_id);
    expect(reloaded?.steps).toHaveLength(2);
    expect(reloaded?.steps[1].agent_id).toBe('agent-builder');
    expect(reloaded?.steps[1].observation).toBe('Build succeeded');
  });

  it('completes and fails chains', () => {
    const tracer = new ReasoningTracer();
    const chain = tracer.createChain('Ship feature X');
    tracer.addStep(chain.chain_id, {
      agent_id: 'agent-1',
      thought: 'Try',
      action: 'run',
      confidence: 0.5,
      dependencies: [],
    });
    const completed = tracer.completeChain(chain.chain_id, 'Feature shipped');
    expect(completed.status).toBe('completed');
    expect(completed.result).toBe('Feature shipped');
    const failed = tracer.failChain(chain.chain_id, 'Timeout');
    expect(failed.status).toBe('failed');
    expect(failed.result).toBe('Timeout');
  });

  it('returns steps filtered by agent', () => {
    const tracer = new ReasoningTracer();
    const chain = tracer.createChain('Ship feature X');
    tracer.addStep(chain.chain_id, {
      agent_id: 'agent-planner',
      thought: 'Plan',
      action: 'plan',
      confidence: 0.9,
      dependencies: [],
    });
    tracer.addStep(chain.chain_id, {
      agent_id: 'agent-builder',
      thought: 'Build',
      action: 'build',
      confidence: 0.8,
      dependencies: [],
    });
    const plannerSteps = tracer.getStepsByAgent('agent-planner');
    expect(plannerSteps).toHaveLength(1);
    expect(plannerSteps[0].action).toBe('plan');
  });

  it('throws when adding steps to unknown chain', () => {
    const tracer = new ReasoningTracer();
    expect(() => tracer.addStep('chain-unknown', {
      agent_id: 'agent-1',
      thought: 'No',
      action: 'act',
      confidence: 0.1,
      dependencies: [],
    })).toThrow("Reasoning chain 'chain-unknown' not found.");
  });
});

describe('CollabPlanner', () => {
  it('builds a collaborative plan from multiple agent contributions', () => {
    const planner = new CollabPlanner();
    const contributions: AgentContribution[] = [
      {
        agent_id: 'agent-planner',
        nodes: [new PlanNode('step-1', 'task', 'Design')],
        resources: { cpu: 1 },
        rationale: 'Design the system',
      },
      {
        agent_id: 'agent-builder',
        nodes: [new PlanNode('step-2', 'task', 'Build', ['step-1'])],
        resources: { cpu: 2 },
        rationale: 'Implement the design',
      },
    ];
    const result = planner.build('Ship feature X', contributions);
    expect(result.plan.nodes).toHaveLength(2);
    expect(result.allocation['step-1']).toBe('agent-planner');
    expect(result.allocation['step-2']).toBe('agent-builder');
    expect(result.conflicts).toHaveLength(0);
  });

  it('detects duplicate nodes as conflicts', () => {
    const planner = new CollabPlanner();
    const contributions: AgentContribution[] = [
      {
        agent_id: 'agent-a',
        nodes: [new PlanNode('step-1', 'task', 'Design')],
        resources: {},
        rationale: 'A designs',
      },
      {
        agent_id: 'agent-b',
        nodes: [new PlanNode('step-1', 'task', 'Design')],
        resources: {},
        rationale: 'B also designs',
      },
    ];
    const result = planner.build('Ship feature X', contributions);
    expect(result.plan.nodes).toHaveLength(1);
    expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
    expect(result.conflicts.some((c) => c.includes("Duplicate node 'step-1'"))).toBe(true);
  });

  it('throws when no contributions are provided', () => {
    const planner = new CollabPlanner();
    expect(() => planner.build('Ship feature X', [])).toThrow('At least one agent contribution is required');
  });

  it('records collaboration in ReasoningTracer when provided', () => {
    const tracer = new ReasoningTracer();
    const planner = new CollabPlanner(tracer);
    const contributions: AgentContribution[] = [
      {
        agent_id: 'agent-planner',
        nodes: [new PlanNode('step-1', 'task', 'Design')],
        resources: { cpu: 1 },
        rationale: 'Design',
      },
    ];
    planner.build('Ship feature X', contributions);
    const chains = Array.from(tracer['chains'].values());
    expect(chains.length).toBe(1);
    expect(chains[0].steps).toHaveLength(1);
    expect(chains[0].steps[0].agent_id).toBe('collab-planner');
  });
});
