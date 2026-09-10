export const DIRECTIVE_DESCRIPTIONS: Record<string, string> = {
  '!alp-version': 'Declares the ALP specification version this file conforms to (e.g., `!alp-version: 3.0.0`).',
  '!import': 'Imports another `.alp` file or remote URL into the current workspace.',
  '!deprecated': 'Marks the following object as deprecated with a migration note (V8+).',
  '!assert': 'Declares a boolean precondition that must hold true or parsing fails (fail-closed since V9).',
  '!if': 'Conditionally includes the next top-level object based on an ALPEL boolean expression.',
  '!integrity': 'Declares a SHA-256 integrity hash for a remote import, verified on load.',
};
