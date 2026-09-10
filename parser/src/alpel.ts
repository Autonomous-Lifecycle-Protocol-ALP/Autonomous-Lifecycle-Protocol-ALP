/**
 * ALP Expression Language (ALPEL, spec/12).
 *
 * A secure, sandboxed, read-only expression language for conditional logic
 * (`!if`, `!assert`, engine conditions) and string interpolation (`${ }`).
 * No mutation, no I/O, deterministic (spec/12 §6).
 *
 * Supported:
 *   - Primitives: strings, numbers, true/false, null
 *   - Property access: `task.feature.name`, `feature.metadata['k']`
 *   - Comparison: == != < > <= >=
 *   - Logical: && || !
 *   - Math: + - * /
 *   - Collection: in, contains
 *   - Built-ins: length, toUpper, toLower, startsWith, size, isEmpty,
 *               hasStatus
 *   - Namespace built-ins (v10.3.0): date.*, math.*, crypto.*, string.*
 *   - Module imports (v10.3.0): `import('name')` for shared ALPEL snippets
 *   - Interpolation: `${ expr }` within string values
 */

export * from './alpel/index';
