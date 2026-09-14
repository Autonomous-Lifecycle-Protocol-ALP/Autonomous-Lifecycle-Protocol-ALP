import { describe, it, expect } from 'vitest';
import { CppGenerator } from '../src/codegen/cpp-generator';

describe('CppGenerator (v82.0.0)', () => {
  const generator = new CppGenerator({
    target: 'cpp',
    namespace: 'app',
    outputDir: './out',
  });

  it('generates a C++ header with pragma once and namespace', () => {
    const objects = [
      {
        _type: 'project',
        id: 'myapp',
        status: '[ ]',
        description: 'My application',
      },
    ];

    const files = generator.generate(objects);
    const headerFile = files.find((f) => f.path.endsWith('Project.hpp'));

    expect(headerFile).toBeDefined();
    expect(headerFile!.content).toContain('#pragma once');
    expect(headerFile!.content).toContain('namespace app');
    expect(headerFile!.content).toContain('class Project');
    expect(headerFile!.content).toContain('static constexpr const char* STATUS_PENDING');
    expect(headerFile!.content).toContain('std::string id_');
    expect(headerFile!.content).toContain('std::string description_');
  });

  it('generates a task with dependency injection in ctor', () => {
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
    const deployHeader = files.find((f) => f.path.endsWith('DeployTask.hpp'));
    const deployImpl = files.find((f) => f.path.endsWith('DeployTask.cpp'));
    const buildHeader = files.find((f) => f.path.endsWith('BuildTask.hpp'));

    expect(deployHeader).toBeDefined();
    expect(deployHeader!.content).toContain('class DeployTask');
    expect(deployHeader!.content).toContain('DeployTask(BuildTask buildType)');
    expect(deployHeader!.content).toContain('std::string id_');

    expect(deployImpl).toBeDefined();
    expect(deployImpl!.content).toContain('#include "DeployTask.hpp"');
    expect(deployImpl!.content).toContain('DeployTask::DeployTask');

    expect(buildHeader).toBeDefined();
    expect(buildHeader!.content).toContain('class BuildTask');
  });

  it('generates a contract with interface and impl', () => {
    const objects = [
      {
        _type: 'contract',
        id: 'api',
        inputs: ['request'],
        outputs: ['response'],
      },
    ];

    const files = generator.generate(objects);
    const ifaceFile = files.find((f) => f.path === './out/IApiContract.hpp');

    expect(ifaceFile).toBeDefined();
    expect(ifaceFile!.content).toContain('class IApiContract');
    expect(ifaceFile!.content).toContain('virtual ~IApiContract() = default');

    const contractFile = files.find((f) => f.path === './out/ApiContract.hpp');
    expect(contractFile).toBeDefined();
    expect(contractFile!.content).toContain('class ApiContract : public IApiContract');
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
    const agentFile = files.find((f) => f.path.endsWith('Agent.hpp'));

    expect(agentFile).toBeDefined();
    expect(agentFile!.content).toContain('class Agent');
    expect(agentFile!.content).toContain('std::string role_');
    expect(agentFile!.content).toContain('std::string prompt_');
    expect(agentFile!.content).toContain('std::vector<std::string> tools_');
    expect(agentFile!.content).toContain('"Build Agent"');
  });

  it('generates a vision model with correct types', () => {
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
    const modelFile = files.find((f) => f.path.endsWith('VisionModel.hpp'));

    expect(modelFile).toBeDefined();
    expect(modelFile!.content).toContain('class VisionModel');
    expect(modelFile!.content).toContain('std::string backbone_');
    expect(modelFile!.content).toContain('int context_tokens_ = 4096');
    expect(modelFile!.content).toContain('int embedding_dim_ = 768');
    expect(modelFile!.content).toContain('int latency_p95_ms_ = 45');
    expect(modelFile!.content).toContain('std::string max_resolution_');
  });

  it('generates correct header and impl file pairs', () => {
    const objects = [
      { _type: 'task', id: 'task-a', status: '[ ]', depends_on: ['-> task-b'] },
      { _type: 'task', id: 'task-b', status: '[x]' },
    ];

    const files = generator.generate(objects);
    const paths = files.map((f) => f.path);

    expect(paths).toContain('./out/Task_aTask.hpp');
    expect(paths).toContain('./out/Task_aTask.cpp');
    expect(paths).toContain('./out/Task_bTask.hpp');
    expect(paths).toContain('./out/Task_bTask.cpp');
  });

  it('generates proper C++ syntax with std:: shared_ptr dependencies', () => {
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
    const deployHeader = files.find((f) => f.path === './out/DeployTask.hpp');

    expect(deployHeader).toBeDefined();
    expect(deployHeader!.content).toContain('BuildTask buildType_');
    expect(deployHeader!.content).toContain('std::string id_');
    expect(deployHeader!.content).toContain('STATUS_PENDING');
    expect(deployHeader!.content).toContain('DeployTask(BuildTask buildType)');
  });

  it('includes dependency headers in the dependent header file', () => {
    const objects = [
      { _type: 'task', id: 'deploy', status: '[ ]', depends_on: ['-> build'] },
      { _type: 'task', id: 'build', status: '[x]' },
    ];

    const files = generator.generate(objects);
    const deployHeader = files.find((f) => f.path.endsWith('DeployTask.hpp'));

    expect(deployHeader).toBeDefined();
    expect(deployHeader!.content).toContain('#include "BuildTask.hpp"');
  });

  it('generates a closed contract interface with virtual destructor', () => {
    const objects = [{ _type: 'contract', id: 'api', inputs: ['request'], outputs: ['response'] }];

    const files = generator.generate(objects);
    const ifaceFile = files.find((f) => f.path.endsWith('IApiContract.hpp'));

    expect(ifaceFile).toBeDefined();
    expect(ifaceFile!.content).toContain('class IApiContract {');
    expect(ifaceFile!.content).toContain('virtual ~IApiContract() = default;');
    // The interface class must be closed before the namespace footer
    expect(ifaceFile!.content).toContain('};\n} // namespace app');
    expect(ifaceFile!.content).not.toContain('enable_shared_from_this');
  });

  it('balances braces in every generated C++ file', () => {
    const objects = [
      { _type: 'task', id: 'deploy', status: '[ ]', depends_on: ['-> build'] },
      { _type: 'task', id: 'build', status: '[x]' },
      { _type: 'contract', id: 'api', inputs: ['request'], outputs: ['response'] },
      { _type: 'agent', id: 'builder', role: 'Build Agent', prompt: 'Build things' },
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
        description: 'He said "hello" \\ backslash',
      },
    ];

    const files = generator.generate(objects);
    const header = files.find((f) => f.path.endsWith('Project.hpp'));

    expect(header).toBeDefined();
    expect(header!.content).toContain('He said \\"hello\\" \\\\ backslash');
  });
});
