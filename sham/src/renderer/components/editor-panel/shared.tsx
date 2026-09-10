export const ALP_KEYWORDS = [
  '@agent', '@skill', '@macro', '@event', '@memory', '@contract', '@vault', '@swarm', '@workflow',
  'description', 'model', 'tools', 'input', 'output', 'expand', 'type', 'payload', 'backend',
  'ttl', 'encryption', 'rotation', 'maxAgents', 'policy', 'steps', 'id', 'agent', 'precondition',
  'postcondition', 'pubsub', 'stream', 'redis', 'aes256', 'balanced', 'round-robin', 'priority',
];

export const ALP_BUILTINS = ['true', 'false', 'null', 'gpt-4o', 'gpt-4o-mini', 'claude-3-opus', 'claude-3-sonnet', 'ollama', 'aes256', 'rsa', 'daily', 'hourly'];

export const ALP_SNIPPETS: Record<string, string> = {
  agent: `@agent ${'{name}'}\n  description: ${'{description}'}\n  model: gpt-4o\n  tools: []\n`,
  skill: `@skill ${'{name}'}\n  description: ${'{description}'}\n  input: text\n  output: text\n`,
  macro: `@macro ${'{name}'}\n  input: ${'{input}'}\n  expand: ${'{expansion}'}\n`,
  event: `@event ${'{name}'}\n  type: pubsub\n  payload: ${'{json}'}\n`,
  memory: `@memory ${'{name}'}\n  backend: redis\n  ttl: 3600\n`,
  contract: `@contract ${'{name}'}\n  precondition: ${'{pre}'}\n  postcondition: ${'{post}'}\n`,
  vault: `@vault ${'{name}'}\n  encryption: aes256\n  rotation: daily\n`,
  swarm: `@swarm ${'{name}'}\n  maxAgents: 8\n  policy: balanced\n`,
  workflow: `@workflow ${'{name}'}\n  steps:\n    - id: step-1\n      agent: ${'{agentId}'}\n`,
};

export function registerAlpLanguage(monaco: any): void {
  if (monaco.languages.getLanguages().some((lang: any) => lang.id === 'alp')) return;

  monaco.languages.register({ id: 'alp' });

  monaco.languages.setMonarchTokensProvider('alp', {
    keywords: ALP_KEYWORDS.reduce((acc, word) => { acc[word] = 'keyword'; return acc; }, {} as Record<string, string>),
    builtins: ALP_BUILTINS.reduce((acc, word) => { acc[word] = 'type'; return acc; }, {} as Record<string, string>),
    tokenizer: {
      root: [
        [/@[a-zA-Z_][\w-]*/, 'keyword'],
        [/#.*$/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
        [/\d+/, 'number'],
        [/\b(?:true|false|null)\b/, 'keyword'],
        [/[a-zA-Z_][\w-]*/, { cases: { '@keywords': 'keyword', '@builtins': 'type', '@default': 'identifier' } }],
        [/[:{}[\](),]/, 'delimiter'],
      ],
      string_double: [
        [/[^\\"]+/, 'string'],
        [/"/, 'string', '@pop'],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('alp', {
    comments: { lineComment: '#' },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
  });
}
