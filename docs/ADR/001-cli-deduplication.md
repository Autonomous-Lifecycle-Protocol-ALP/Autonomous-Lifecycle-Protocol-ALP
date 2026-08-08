# ADR-001: CLI Command Registration Deduplication

## Status
Accepted — 2026-08-03

## Context
`cli/src/index.ts` contained duplicate command registrations. Commander.js
allows the same command name to be registered multiple times, but only the
first registration takes effect; subsequent registrations are silently ignored.
This meant:

- Lines 108–492 registered ~50 commands (schedule, swarm, repo, registry,
  install, uninstall, publish, keys, test-harness, replay, visualize, export,
  cost, debug, bridge, domain-trust, governance, tenant, healing,
  resilience, tui, settings, search, git).
- Lines 500–686 re-registered the same commands with identical definitions.
- Lines 687–726 called `registerTraceCommand`, `registerZKCommand`, and 30+
  other `register*` helpers twice (lines 493–498 and 687–726).

Consequences:
- Dead code in a critical entry point.
- Risk of divergent options/actions between duplicate blocks during edits.
- ~230 lines of noise in a 746-line file.

## Decision
Remove the duplicate block (lines 500–726) entirely. All commands remain
registered exactly once in the canonical block (lines 108–498).

## Rationale
- Commander.js does not warn on duplicate registrations; duplicates are pure
  dead weight.
- Single registration per command is the standard Commander.js pattern.
- Reduces file size from 746 to ~500 lines, improving maintainability.

## Consequences
- `cli/src/index.ts` is now ~66% of its previous size.
- Future command additions go in one place only (lines 108–498).
- No change to CLI behavior: all commands and options are preserved.

## Related
- Fix: `cli/src/index.ts` lines 500–726 removed.
