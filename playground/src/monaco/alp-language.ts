import * as monaco from 'monaco-editor';

const ALP_TYPES: Record<string, string> = {
  task: 'A unit of work with inputs, outputs, and dependencies',
  agent: 'An autonomous agent with a role, tools, and behavioral rules',
  feature: 'A product feature or capability being delivered',
  workflow: 'An ordered sequence of steps or pipeline definition',
  policy: 'A governance rule or constraint for the system',
  contract: 'An interface contract specifying inputs, outputs, and guarantees',
  vault: 'A secure storage for secrets, keys, or credentials',
  rule: 'A reactive trigger or inference rule in the system',
  timeline: 'A time-ordered plan or schedule of events',
  memory: 'A persistent memory store or knowledge base entry',
  swarm: 'A coordinated group of agents working together',
  tenant: 'An isolated tenant or namespace boundary',
  project: 'A top-level project or initiative container',
  multimodal: 'A block that handles multiple input/output modalities',
  vision_model: 'A computer vision or image understanding model',
  action_space: 'A definition of valid actions for an agent or environment',
};

const ALP_SNIPPETS: Record<string, string> = {
  task: `@task $1
  id: $1
  status: [ ]
  prompt: $2
  inputs: []
  outputs: []
  depends_on: []`,
  agent: `@agent $1
  id: $1
  role: "$2"
  prompt: $3
  tools: []`,
  feature: `@feature $1
  id: $1
  status: [ ]
  description: $2
  priority: $3`,
  workflow: `@workflow $1
  id: $1
  status: [ ]
  steps: []`,
  policy: `@policy $1
  id: $1
  status: [ ]
  rules: []`,
  contract: `@contract $1
  id: $1
  status: [ ]
  inputs: []
  outputs: []
  guarantees: []`,
  vault: `@vault $1
  id: $1
  status: [ ]
  secrets: []`,
  rule: `@rule $1
  id: $1
  status: [ ]
  trigger: $2
  action: $3`,
  timeline: `@timeline $1
  id: $1
  status: [ ]
  events: []`,
  memory: `@memory $1
  id: $1
  status: [ ]
  store: "$2"`,
  swarm: `@swarm $1
  id: $1
  status: [ ]
  agents: []
  coordination: "$2"`,
  tenant: `@tenant $1
  id: $1
  status: [ ]
  namespace: $2`,
  project: `@project $1
  id: $1
  status: [ ]
  description: $2`,
  multimodal: `@multimodal $1
  id: $1
  status: [ ]
  modal: "$2"
  vision_models: []
  action_space: []`,
  vision_model: `@vision_model $1
  id: $1
  status: [ ]
  model: "$2"
  inputs: []`,
  action_space: `@action_space $1
  id: $1
  status: [ ]
  actions: []`,
};

const ALP_KEYS: Record<string, string> = {
  id: 'Unique identifier for this block',
  type: 'The ALP block type (e.g., task, agent, feature)',
  status: 'Current status marker: [ ] pending, [x] done, [~] in-progress, [!] blocked, [?] review',
  owner: 'Person or agent responsible for this block',
  prompt: 'Natural-language instruction or description for the block',
  inputs: 'List of input dependencies or data sources',
  outputs: 'List of expected outputs or artifacts',
  depends_on: 'List of block IDs this block depends on',
  weight: 'Relative priority or weight for scheduling (number)',
  deadline: 'Deadline timestamp or duration for completion',
  policy_ref: 'Reference to a @policy block by ID',
  tokens: 'Token budget or limit for LLM calls (number)',
  temperature: 'Sampling temperature for LLM generation (0.0–2.0)',
  model: 'LLM model identifier (e.g., gpt-4, claude-3)',
  modal: 'Modality type: text, image, audio, video',
  action_space: 'Definition of valid actions (array or reference)',
  vision_models: 'List of vision model IDs or references',
  description: 'Human-readable description of the block',
};

const STATUS_MARKERS: Record<string, string> = {
  '[ ]': 'Pending — not yet started',
  '[x]': 'Done — completed successfully',
  '[~]': 'In Progress — currently being worked on',
  '[!]': 'Blocked — cannot proceed due to a blocker',
  '[?]': 'Review — awaiting review or approval',
};

export function initAlpLanguage(): void {
  monaco.languages.register({
    id: 'alp',
    extensions: ['.alp'],
    aliases: ['ALP', 'Autonomous Lifecycle Protocol'],
    mimetypes: ['text/alp', 'application/alp'],
  });

  monaco.languages.setMonarchTokensProvider('alp', {
    tokenizer: {
      root: [
        [/#.*$/, 'comment'],
        [/\b(id|type|status|owner|prompt|inputs|outputs|depends_on|weight|deadline|policy_ref|tokens|temperature|model|modal|action_space|vision_models|description)\s*:/, 'key'],
        [/@\w+/, 'keyword.type'],
        [/\[\s*[ x~!?]\s*\]/, 'status.marker'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, 'string.single', '@string_single'],
        [/"/, 'string.double', '@string_double'],
        [/\d+/, 'number'],
        [/:/, 'delimiter'],
        [/[\[\]]/, 'bracket'],
        [/[{}]/, 'bracket'],
        [/\w+/, 'identifier'],
      ],
      string_single: [
        [/[^\\']+/, 'string'],
        [/'/, 'string', '@pop'],
      ],
      string_double: [
        [/[^\\"]+/, 'string'],
        [/"/, 'string', '@pop'],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('alp', {
    comments: {
      lineComment: '#',
    },
    brackets: [
      ['[', ']'],
      ['{', '}'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '[', close: ']', notIn: ['string', 'comment'] },
      { open: '{', close: '}', notIn: ['string', 'comment'] },
      { open: '(', close: ')', notIn: ['string', 'comment'] },
      { open: '"', close: '"', notIn: ['string', 'comment'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    indentationRules: {
      increaseIndentPattern: /^(\s*)[^\s#].*:\s*(?:\/\/.*)?$/m,
      decreaseIndentPattern: /^(?!\s*$).*(?<!:\s*)$/m,
    },
    folding: {
      markers: {
        start: /^(\s*)@\w+(\s.*)?$/m,
        end: /^\s*$/m,
      },
    },
  });

  monaco.editor.defineTheme('alp-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.type', foreground: '00f0ff', fontStyle: 'bold' },
      { token: 'status.marker', foreground: 'f59e0b' },
      { token: 'comment', foreground: '10b981', fontStyle: 'italic' },
      { token: 'key', foreground: 'a78bfa' },
      { token: 'string', foreground: 'f97316' },
      { token: 'string.invalid', foreground: 'f59e0b' },
      { token: 'number', foreground: '34d399' },
      { token: 'delimiter', foreground: '94a3b8' },
      { token: 'bracket', foreground: '94a3b8' },
      { token: 'identifier', foreground: 'e2e8f0' },
    ],
    colors: {
      'editor.background': '#0a0e17',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#111827',
      'editor.selectionBackground': '#1e3a5f',
      'editor.inactiveSelectionBackground': '#1e3a5f80',
      'editorCursor.foreground': '#00f0ff',
      'editorLineNumber.foreground': '#374151',
      'editorLineNumber.activeForeground': '#00f0ff',
      'editor.findMatchBackground': '#00f0ff30',
      'editor.findMatchHighlightBackground': '#00f0ff20',
      'editorOverviewRuler.border': '#0a0e17',
      'scrollbarSlider.background': '#1e293b60',
      'scrollbarSlider.hoverBackground': '#33415580',
      'scrollbarSlider.activeBackground': '#475569',
      'editorWidget.background': '#0a0e17',
      'editorSuggestWidget.background': '#0a0e17',
      'editorSuggestWidget.border': '#1e293b',
      'editorSuggestWidget.selectedBackground': '#1e293b',
      'editorHoverWidget.background': '#0a0e17',
      'editorHoverWidget.border': '#1e293b',
    },
  });

  monaco.languages.registerCompletionItemProvider('alp', {
    triggerCharacters: ['@', ':', ' '],
    provideCompletionItems: (_model, position) => {
      const wordInfo = _model.getWordUntilPosition(position);
      const textUntil = _model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: wordInfo.endColumn,
      };

      const suggestions: monaco.languages.CompletionItem[] = [];

      const lineText = _model.getLineContent(position.lineNumber);
      const col = position.column;
      const isInsideBracket = /\[\s*[^\]\n]*$/.test(lineText.slice(0, col - 1));
      const afterAt = /\B@$/.test(textUntil) || /\B@\S*$/.test(textUntil);
      const afterColon = /\b\w*:$/.test(lineText.trim());

      if (afterAt || (textUntil.trimEnd().endsWith('@') && wordInfo.word === '')) {
        for (const [type, desc] of Object.entries(ALP_TYPES)) {
          suggestions.push({
            label: `@${type}`,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: ALP_SNIPPETS[type],
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: { value: `**@${type}** — ${desc}` },
            range,
          });
        }
      } else if (afterColon || wordInfo.word.endsWith(':')) {
        for (const [key, desc] of Object.entries(ALP_KEYS)) {
          suggestions.push({
            label: `${key}:`,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `${key}: `,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: { value: `**${key}** — ${desc}` },
            range,
          });
        }
      } else if (isInsideBracket) {
        for (const [marker, desc] of Object.entries(STATUS_MARKERS)) {
          suggestions.push({
            label: marker,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: marker,
            documentation: { value: desc },
            range,
          });
        }
      } else {
        for (const [type, desc] of Object.entries(ALP_TYPES)) {
          suggestions.push({
            label: `@${type}`,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: ALP_SNIPPETS[type],
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: { value: `**@${type}** — ${desc}` },
            range,
          });
        }
        for (const [key, desc] of Object.entries(ALP_KEYS)) {
          suggestions.push({
            label: `${key}:`,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: `${key}: `,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: { value: `**${key}** — ${desc}` },
            range,
          });
        }
        for (const [marker, desc] of Object.entries(STATUS_MARKERS)) {
          suggestions.push({
            label: marker,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: marker,
            documentation: { value: desc },
            range,
          });
        }
      }

      return { suggestions };
    },
  });

  monaco.languages.registerHoverProvider('alp', {
    provideHover: (_model, position) => {
      const word = _model.getWordAtPosition(position);
      if (!word) return null;

      const token = word.word;
      let markdown: string | undefined;

      if (ALP_TYPES[token]) {
        markdown = `**@${token}** — ${ALP_TYPES[token]}`;
      } else if (STATUS_MARKERS[token]) {
        markdown = `**${token}** — ${STATUS_MARKERS[token]}`;
      } else if (ALP_KEYS[token]) {
        markdown = `**${token}** — ${ALP_KEYS[token]}`;
      }

      if (markdown) {
        return {
          range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
          contents: [{ value: markdown }],
        };
      }

      return null;
    },
  });
}
