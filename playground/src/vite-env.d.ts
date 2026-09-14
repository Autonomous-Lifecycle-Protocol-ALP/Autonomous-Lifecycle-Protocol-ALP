/// <reference types="vite/client" />

declare module 'monaco-editor' {
  export namespace languages {
    export interface CompletionItem {
      label: string;
      kind: any;
      insertText: string;
      insertTextRules?: any;
      documentation?: any;
      range: any;
      [key: string]: any;
    }
    export const CompletionItemKind: any;
    export const CompletionItemInsertTextRule: any;
    export function register(def: any): void;
    export function setMonarchTokensProvider(lang: string, def: any): void;
    export function setLanguageConfiguration(lang: string, def: any): void;
    export function registerCompletionItemProvider(lang: string, def: any): void;
    export function registerHoverProvider(lang: string, def: any): void;
  }
  export namespace editor {
    export interface ITextModel {
      getWordUntilPosition(pos: any): any;
      getWordAtPosition(pos: any): any;
      getValueInRange(range: any): string;
      getLineContent(lineNumber: number): string;
      [key: string]: any;
    }
    export function defineTheme(name: string, theme: any): void;
  }
  export class Position {
    constructor(lineNumber: number, column: number);
    lineNumber: number;
    column: number;
  }
  export class Range {
    constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
  }
  export interface IRange {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }
}
