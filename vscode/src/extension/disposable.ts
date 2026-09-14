import * as vscode from 'vscode';
import { AlpParser } from '@autonomous-lifecycle-protocol-alp/parser';

export function escapeHtml(value: string | undefined | null): string {
  if (value == null) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const panels = new Map<string, vscode.WebviewPanel>();
export const parserCache = new Map<string, { result: any[]; version: number }>();

export function getParsedObjects(document: vscode.TextDocument | undefined): any[] {
  if (!document) return [];
  const key = `${document.uri.toString()}:${document.version}`;
  const cached = parserCache.get(key);
  if (cached) return cached.result;
  const result = new AlpParser().parseAndValidate(document.getText());
  parserCache.set(key, { result, version: document.version });
  return result;
}