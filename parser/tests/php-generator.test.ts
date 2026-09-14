import { describe, it, expect } from 'vitest';
import { PhpGenerator } from '../src/codegen/php-generator';

describe('PhpGenerator (v82.0.0)', () => {
  const generator = new PhpGenerator({
    target: 'php',
    namespace: 'App',
    outputDir: './out',
  });

  it('generates a PHP class from a @project object', () => {
    const objects = [
      {
        _type: 'project',
        id: 'myapp',
        status: '[ ]',
        description: 'My application',
      },
    ];

    const files = generator.generate(objects);
    const projectFile = files.find((f) => f.path.endsWith('Project.php'));

    expect(projectFile).toBeDefined();
    expect(projectFile!.content).toContain('namespace App;');
    expect(projectFile!.content).toContain('class Project');
    expect(projectFile!.content).toContain('private const STATUS_PENDING');
    expect(projectFile!.content).toContain("private string $id = 'myapp'");
    expect(projectFile!.content).toContain("private string $description = 'My application'");
  });

  it('generates a task with dependency injection', () => {
    const objects = [
      {
        _type: 'task',
        id: 'deploy',
        status: '[ ]',
        depends_on: ['-> build'],
      },
      {
        _type: 'task',
        id: 'build',
        status: '[x]',
      },
    ];

    const files = generator.generate(objects);
    const deployFile = files.find((f) => f.path.endsWith('DeployTask.php'));
    const buildFile = files.find((f) => f.path.endsWith('BuildTask.php'));

    expect(deployFile).toBeDefined();
    expect(deployFile!.content).toContain('class DeployTask');
    expect(deployFile!.content).toContain('public function __construct(BuildTask $build)');
    expect(deployFile!.content).toContain('$this->buildType = $build;');
    expect(deployFile!.content).toContain('private const STATUS_PENDING');

    expect(buildFile).toBeDefined();
    expect(buildFile!.content).toContain('class BuildTask');
    expect(buildFile!.content).toContain('private const STATUS_DONE');
  });

  it('generates a contract with interface', () => {
    const objects = [
      {
        _type: 'contract',
        id: 'api',
        inputs: ['request'],
        outputs: ['response'],
      },
    ];

    const files = generator.generate(objects);
    const contractFile = files.find((f) => f.path.endsWith('Contract.php'));
    const ifaceFile = files.find((f) => f.path.endsWith('ContractInterface.php'));

    expect(contractFile).toBeDefined();
    expect(ifaceFile).toBeDefined();
    expect(contractFile!.content).toContain('class Contract implements ContractInterface');
    expect(ifaceFile!.content).toContain('interface ContractInterface');
  });

  it('generates an agent with role and tools', () => {
    const objects = [
      {
        _type: 'agent',
        id: 'builder',
        role: 'Build Agent',
        prompt: 'Build things',
        tools: ['compile', 'test'],
      },
    ];

    const files = generator.generate(objects);
    const agentFile = files.find((f) => f.path.endsWith('Agent.php'));

    expect(agentFile).toBeDefined();
    expect(agentFile!.content).toContain('class Agent');
    expect(agentFile!.content).toContain("private string $role = 'Build Agent'");
    expect(agentFile!.content).toContain("private string $prompt = 'Build things'");
    expect(agentFile!.content).toContain('private array $tools');
  });

  it('generates a vision model with backbone and tokens', () => {
    const objects = [
      {
        _type: 'vision_model',
        id: 'clip-base',
        backbone: 'clip',
        context_tokens: 4096,
        embedding_dim: 768,
        latency_p95_ms: 45,
        max_resolution: '1024x1024',
      },
    ];

    const files = generator.generate(objects);
    const modelFile = files.find((f) => f.path.endsWith('VisionModel.php'));

    expect(modelFile).toBeDefined();
    expect(modelFile!.content).toContain('class VisionModel');
    expect(modelFile!.content).toContain("private string $backbone = 'clip'");
    expect(modelFile!.content).toContain('private int $contextTokens = 4096');
    expect(modelFile!.content).toContain('private int $embeddingDim = 768');
    expect(modelFile!.content).toContain('private int $latencyP95Ms = 45');
    expect(modelFile!.content).toContain("private string $maxResolution = '1024x1024'");
  });

  it('generates correct file paths', () => {
    const objects = [
      { _type: 'task', id: 'task-a', status: '[ ]' },
      { _type: 'agent', id: 'agent-b', status: '[x]' },
    ];

    const files = generator.generate(objects);
    const paths = files.map((f) => f.path);

    expect(paths).toContain('./out/Task.php');
    expect(paths).toContain('./out/Agent.php');
  });

  it('generates valid PHP syntax with opening tag', () => {
    const objects = [
      { _type: 'project', id: 'test', status: '[ ]' },
    ];

    const files = generator.generate(objects);
    const projectFile = files.find((f) => f.path.endsWith('Project.php'));

    expect(projectFile!.content).toContain('<?php');
  });

  it('closes contract interface files with a brace', () => {
    const objects = [{ _type: 'contract', id: 'api', inputs: ['request'], outputs: ['response'] }];

    const files = generator.generate(objects);
    const ifaceFile = files.find((f) => f.path.endsWith('ContractInterface.php'));

    expect(ifaceFile).toBeDefined();
    expect(ifaceFile!.content).toContain('interface ContractInterface {');
    expect(ifaceFile!.content.trimEnd().endsWith('}')).toBe(true);
  });

  it('emits only the dependencies a class actually uses as imports', () => {
    const objects = [
      { _type: 'task', id: 'deploy', status: '[ ]', depends_on: ['-> build'] },
      { _type: 'task', id: 'build', status: '[x]' },
      { _type: 'agent', id: 'builder', role: 'Build Agent' },
    ];

    const files = generator.generate(objects);
    const agentFile = files.find((f) => f.path.endsWith('Agent.php'));
    const deployFile = files.find((f) => f.path.endsWith('DeployTask.php'));
    const buildFile = files.find((f) => f.path.endsWith('BuildTask.php'));

    expect(agentFile).toBeDefined();
    expect(agentFile!.content).not.toContain('use App\\');

    expect(deployFile).toBeDefined();
    expect(deployFile!.content).toContain('use App\\BuildTask;');

    expect(buildFile).toBeDefined();
    expect(buildFile!.content).not.toContain('use App\\DeployTask');
  });

  it('declares typed properties for constructor-injected dependencies', () => {
    const objects = [
      { _type: 'task', id: 'deploy', status: '[ ]', depends_on: ['-> build'] },
      { _type: 'task', id: 'build', status: '[x]' },
    ];

    const files = generator.generate(objects);
    const deployFile = files.find((f) => f.path.endsWith('DeployTask.php'));

    expect(deployFile).toBeDefined();
    expect(deployFile!.content).toContain('private ?BuildTask $buildType = null;');
  });

  it('balances braces in every generated PHP file', () => {
    const objects = [
      { _type: 'task', id: 'deploy', status: '[ ]', depends_on: ['-> build'] },
      { _type: 'task', id: 'build', status: '[x]' },
      { _type: 'contract', id: 'api', inputs: ['request'], outputs: ['response'] },
      { _type: 'agent', id: 'builder', role: 'Build Agent', tools: ['compile'] },
    ];

    const files = generator.generate(objects);
    for (const file of files) {
      const opens = (file.content.match(/\{/g) || []).length;
      const closes = (file.content.match(/\}/g) || []).length;
      expect(opens, `unbalanced braces in ${file.path}`).toBe(closes);
    }
  });

  it('escapes special characters inside generated string literals', () => {
    const objects = [
      {
        _type: 'project',
        id: 'weird',
        description: "It's a \\ test",
      },
    ];

    const files = generator.generate(objects);
    const projectFile = files.find((f) => f.path.endsWith('Project.php'));

    expect(projectFile).toBeDefined();
    expect(projectFile!.content).toContain("It\\'s a \\\\ test");
  });
});
