export type Token =
  | { t: string; v: any }
  | { t: 'lbrace'; v: string }
  | { t: 'rbrace'; v: string };

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    if (ch === '(' ) { tokens.push({ t: 'lp', v: '(' }); i++; continue; }
    if (ch === ')' ) { tokens.push({ t: 'rp', v: ')' }); i++; continue; }
    if (ch === ',' ) { tokens.push({ t: 'comma', v: ',' }); i++; continue; }
    if (ch === ':' ) { tokens.push({ t: 'colon', v: ':' }); i++; continue; }
    if (ch === '[' ) { tokens.push({ t: 'lb', v: '[' }); i++; continue; }
    if (ch === ']' ) { tokens.push({ t: 'rb', v: ']' }); i++; continue; }
    if (ch === '.' ) { tokens.push({ t: 'dot', v: '.' }); i++; continue; }
    if (ch === '{' ) { tokens.push({ t: 'lbrace', v: '{' }); i++; continue; }
    if (ch === '}' ) { tokens.push({ t: 'rbrace', v: '}' }); i++; continue; }
    if (ch === '&' && expr[i + 1] === '&') { tokens.push({ t: 'op', v: '&&' }); i += 2; continue; }
    if (ch === '|' && expr[i + 1] === '|') { tokens.push({ t: 'op', v: '||' }); i += 2; continue; }
    if (ch === '=' && expr[i + 1] === '=') { tokens.push({ t: 'op', v: '==' }); i += 2; continue; }
    if (ch === '!' && expr[i + 1] === '=') { tokens.push({ t: 'op', v: '!=' }); i += 2; continue; }
    if (ch === '<' && expr[i + 1] === '=') { tokens.push({ t: 'op', v: '<=' }); i += 2; continue; }
    if (ch === '>' && expr[i + 1] === '=') { tokens.push({ t: 'op', v: '>=' }); i += 2; continue; }
    if (ch === '=' || ch === '<' || ch === '>') { tokens.push({ t: 'op', v: ch }); i++; continue; }
    if (ch === '!' ) { tokens.push({ t: 'op', v: '!' }); i++; continue; }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') { tokens.push({ t: 'op', v: ch }); i++; continue; }
    if (ch === '"' || ch === "'") {
      const start = i;
      i++;
      while (i < expr.length && expr[i] !== ch) i++;
      i++;
      tokens.push({ t: 'str', v: expr.slice(start + 1, i - 1) });
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(expr[i + 1] || ''))) {
      const start = i;
      i++;
      while (i < expr.length && /[0-9.]/.test(expr[i])) i++;
      tokens.push({ t: 'num', v: Number(expr.slice(start, i)) });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      i++;
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) i++;
      const word = expr.slice(start, i);
      if (word === 'true') { tokens.push({ t: 'bool', v: true }); }
      else if (word === 'false') { tokens.push({ t: 'bool', v: false }); }
      else if (word === 'null') { tokens.push({ t: 'null', v: null }); }
      else if (word === 'in') { tokens.push({ t: 'op', v: word }); }
      else { tokens.push({ t: 'id', v: word }); }
      continue;
    }
    throw new Error(`ALPEL: unexpected character '${ch}'`);
  }
  return tokens;
}
