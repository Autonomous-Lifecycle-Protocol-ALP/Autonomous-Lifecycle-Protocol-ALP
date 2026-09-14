/**
 * High-performance syntax highlighter for ALP, JSON, TypeScript, and Markdown.
 * Produces sanitized HTML with Catppuccin Macchiato/Mocha color palette.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const SYNTAX_PALETTE = {
  keyword: '#f38ba8',       // Coral Pink / Red
  directive: '#f38ba8',     // @agent, @skill, etc.
  property: '#cba6f7',      // Mauve / Purple
  string: '#a6e3a1',        // Emerald Green
  number: '#fab387',        // Peach / Orange
  boolean: '#f9e2af',       // Yellow
  type: '#89dceb',          // Cyan / Sky
  comment: '#6c7086',       // Muted Gray / Slate
  function: '#89b4fa',      // Sapphire Blue
  name: '#89b4fa',          // Identified names
  delimiter: '#94a3b8',     // Punctuation / brackets
  text: '#cdd6f4',          // Standard text
};

export function highlightAlpLine(line: string): string {
  // Check for full line comment
  const commentMatch = line.match(/^(\s*)(#.*)$/);
  if (commentMatch) {
    return `${escapeHtml(commentMatch[1])}<span style="color: ${SYNTAX_PALETTE.comment}; font-style: italic;">${escapeHtml(commentMatch[2])}</span>`;
  }

  // Tokenize line
  let result = '';
  let i = 0;

  while (i < line.length) {
    // Trailing inline comment
    if (line[i] === '#' && (i === 0 || line[i - 1] === ' ' || line[i - 1] === '\t')) {
      const commentText = line.substring(i);
      result += `<span style="color: ${SYNTAX_PALETTE.comment}; font-style: italic;">${escapeHtml(commentText)}</span>`;
      break;
    }

    // Directive e.g. @agent, @skill, @workflow, @project, etc.
    if (line[i] === '@') {
      const match = line.substring(i).match(/^@[a-zA-Z0-9_-]+/);
      if (match) {
        result += `<span style="color: ${SYNTAX_PALETTE.directive}; font-weight: 700; text-shadow: 0 0 12px rgba(243, 139, 168, 0.4);">${escapeHtml(match[0])}</span>`;
        i += match[0].length;
        continue;
      }
    }

    // Double quoted string
    if (line[i] === '"') {
      const match = line.substring(i).match(/^"([^"\\]|\\.)*"/);
      if (match) {
        result += `<span style="color: ${SYNTAX_PALETTE.string};">${escapeHtml(match[0])}</span>`;
        i += match[0].length;
        continue;
      } else {
        // Unclosed string till end of line
        result += `<span style="color: ${SYNTAX_PALETTE.string};">${escapeHtml(line.substring(i))}</span>`;
        break;
      }
    }

    // Single quoted string
    if (line[i] === "'") {
      const match = line.substring(i).match(/^'([^'\\]|\\.)*'/);
      if (match) {
        result += `<span style="color: ${SYNTAX_PALETTE.string};">${escapeHtml(match[0])}</span>`;
        i += match[0].length;
        continue;
      }
    }

    // Numbers
    const numMatch = line.substring(i).match(/^\b\d+(\.\d+)?\b/);
    if (numMatch && (i === 0 || /[\s,:(\[{=]/.test(line[i - 1]))) {
      result += `<span style="color: ${SYNTAX_PALETTE.number}; font-weight: 600;">${numMatch[0]}</span>`;
      i += numMatch[0].length;
      continue;
    }

    // Property key (e.g. `description:`, `model:`, `input:`)
    const propMatch = line.substring(i).match(/^([a-zA-Z0-9_-]+)(\s*:)/);
    if (propMatch && (i === 0 || line[i - 1] === ' ' || line[i - 1] === '\t')) {
      result += `<span style="color: ${SYNTAX_PALETTE.property}; font-weight: 600;">${escapeHtml(propMatch[1])}</span><span style="color: ${SYNTAX_PALETTE.delimiter};">${escapeHtml(propMatch[2])}</span>`;
      i += propMatch[0].length;
      continue;
    }

    // Words / Keywords / Identifiers
    const wordMatch = line.substring(i).match(/^[a-zA-Z0-9_-]+/);
    if (wordMatch) {
      const word = wordMatch[0];
      if (/^(true|false|null)$/i.test(word)) {
        result += `<span style="color: ${SYNTAX_PALETTE.boolean}; font-weight: 600;">${word}</span>`;
      } else if (/^(claude-[\w.-]+|gpt-[\w.-]+|ollama|bft-consensus|mesh_network|redis|aes256)$/i.test(word)) {
        result += `<span style="color: ${SYNTAX_PALETTE.type}; font-weight: 600;">${word}</span>`;
      } else if (/^(string|number|boolean|json|text|array|object|pubsub|stream)$/i.test(word)) {
        result += `<span style="color: ${SYNTAX_PALETTE.type};">${word}</span>`;
      } else if (/^(step|task|nodes|protocol|balanced|priority|round-robin)$/i.test(word)) {
        result += `<span style="color: ${SYNTAX_PALETTE.keyword};">${word}</span>`;
      } else {
        // Name / Identifier
        result += `<span style="color: ${SYNTAX_PALETTE.name};">${word}</span>`;
      }
      i += word.length;
      continue;
    }

    // Brackets and delimiters
    if (/^[{}[\]():,]/.test(line[i])) {
      result += `<span style="color: ${SYNTAX_PALETTE.delimiter}; font-weight: 600;">${escapeHtml(line[i])}</span>`;
      i++;
      continue;
    }

    // Any other character (whitespace, symbols)
    result += escapeHtml(line[i]);
    i++;
  }

  return result;
}

export function highlightJsonLine(line: string): string {
  let result = '';
  let i = 0;

  while (i < line.length) {
    // String (Key or Value)
    if (line[i] === '"') {
      const match = line.substring(i).match(/^"([^"\\]|\\.)*"/);
      if (match) {
        const afterStr = line.substring(i + match[0].length);
        const isKey = /^\s*:/.test(afterStr);
        const color = isKey ? SYNTAX_PALETTE.function : SYNTAX_PALETTE.string;
        const weight = isKey ? '600' : 'normal';
        result += `<span style="color: ${color}; font-weight: ${weight};">${escapeHtml(match[0])}</span>`;
        i += match[0].length;
        continue;
      }
    }

    // Numbers
    const numMatch = line.substring(i).match(/^\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b/);
    if (numMatch) {
      result += `<span style="color: ${SYNTAX_PALETTE.number}; font-weight: 600;">${numMatch[0]}</span>`;
      i += numMatch[0].length;
      continue;
    }

    // Booleans and null
    const boolMatch = line.substring(i).match(/^\b(true|false|null)\b/);
    if (boolMatch) {
      result += `<span style="color: ${SYNTAX_PALETTE.boolean}; font-weight: 600;">${boolMatch[0]}</span>`;
      i += boolMatch[0].length;
      continue;
    }

    // Delimiters
    if (/^[{}\[\],:]/.test(line[i])) {
      result += `<span style="color: ${SYNTAX_PALETTE.delimiter}; font-weight: 600;">${escapeHtml(line[i])}</span>`;
      i++;
      continue;
    }

    result += escapeHtml(line[i]);
    i++;
  }

  return result;
}

export function highlightTypeScriptLine(line: string): string {
  // Comments
  if (/^\s*\/\//.test(line)) {
    return `<span style="color: ${SYNTAX_PALETTE.comment}; font-style: italic;">${escapeHtml(line)}</span>`;
  }

  let result = '';
  let i = 0;

  while (i < line.length) {
    // Inline comment
    if (line.substring(i, i + 2) === '//') {
      result += `<span style="color: ${SYNTAX_PALETTE.comment}; font-style: italic;">${escapeHtml(line.substring(i))}</span>`;
      break;
    }

    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i];
      const match = line.substring(i).match(new RegExp(`^${quote}([^${quote}\\\\]|\\\\.)*${quote}`));
      if (match) {
        result += `<span style="color: ${SYNTAX_PALETTE.string};">${escapeHtml(match[0])}</span>`;
        i += match[0].length;
        continue;
      }
    }

    // Keywords
    const wordMatch = line.substring(i).match(/^[a-zA-Z_$][\w$]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      if (/^(import|from|export|default|const|let|var|function|async|await|return|if|else|switch|case|break|new|try|catch|throw|typeof|interface|type|class|extends|implements)$/.test(word)) {
        result += `<span style="color: ${SYNTAX_PALETTE.keyword}; font-weight: 700;">${word}</span>`;
      } else if (/^(string|number|boolean|any|void|unknown|never|Promise|Record|Array|object)$/.test(word)) {
        result += `<span style="color: ${SYNTAX_PALETTE.type}; font-weight: 600;">${word}</span>`;
      } else if (/^(true|false|null|undefined)$/.test(word)) {
        result += `<span style="color: ${SYNTAX_PALETTE.boolean}; font-weight: 600;">${word}</span>`;
      } else if (line[i + word.length] === '(') {
        result += `<span style="color: ${SYNTAX_PALETTE.function};">${word}</span>`;
      } else {
        result += `<span style="color: ${SYNTAX_PALETTE.text};">${word}</span>`;
      }
      i += word.length;
      continue;
    }

    // Numbers
    const numMatch = line.substring(i).match(/^\b\d+(\.\d+)?\b/);
    if (numMatch) {
      result += `<span style="color: ${SYNTAX_PALETTE.number}; font-weight: 600;">${numMatch[0]}</span>`;
      i += numMatch[0].length;
      continue;
    }

    // Delimiters
    if (/^[{}()[\];,.:<>]/.test(line[i])) {
      result += `<span style="color: ${SYNTAX_PALETTE.delimiter};">${escapeHtml(line[i])}</span>`;
      i++;
      continue;
    }

    result += escapeHtml(line[i]);
    i++;
  }

  return result;
}

export function highlightMarkdownLine(line: string): string {
  // Heading
  if (/^#{1,6}\s+/.test(line)) {
    return `<span style="color: ${SYNTAX_PALETTE.function}; font-weight: 700;">${escapeHtml(line)}</span>`;
  }
  // Bullet / list
  if (/^\s*[-*+]\s+/.test(line)) {
    return line.replace(/^(\s*[-*+]\s+)(.*)$/, (_, bullet, rest) => {
      return `<span style="color: ${SYNTAX_PALETTE.keyword}; font-weight: bold;">${escapeHtml(bullet)}</span>${escapeHtml(rest)}`;
    });
  }

  return escapeHtml(line)
    .replace(/(`[^`]+`)/g, `<span style="color: ${SYNTAX_PALETTE.number}; background: rgba(255,255,255,0.07); padding: 1px 4px; border-radius: 3px;">$1</span>`)
    .replace(/(\*\*[^*]+\*\*)/g, `<span style="color: ${SYNTAX_PALETTE.boolean}; font-weight: bold;">$1</span>`);
}

/**
 * Highlights a full code buffer for a given language.
 */
export function highlightCode(code: string, language: string): string {
  if (!code) return '';
  const lines = code.split('\n');

  const highlightedLines = lines.map((line) => {
    switch (language) {
      case 'alp':
        return highlightAlpLine(line);
      case 'json':
        return highlightJsonLine(line);
      case 'typescript':
      case 'javascript':
        return highlightTypeScriptLine(line);
      case 'markdown':
        return highlightMarkdownLine(line);
      default:
        return escapeHtml(line);
    }
  });

  return highlightedLines.join('\n');
}
