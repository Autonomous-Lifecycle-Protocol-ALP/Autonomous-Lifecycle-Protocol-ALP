// ALP Enterprise Agent Entry Point
const { Agent } = require('alp');

const agent = new Agent({
  name: 'code-assistant',
  model: 'gpt-4o',
  tools: ['read', 'write', 'run', 'test'],
});

agent.run();
