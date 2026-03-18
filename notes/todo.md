# TODO Roadmap (Active Only)

This file tracks only open work. Completed items are intentionally removed.

## P0 — Security & Configuration

- Add stricter environment validation for required secrets and URLs.
- Revisit mobile token storage strategy for native devices.
- Complete migration-first DB workflow and disable schema sync outside local development.

## P1 — Auth & State Consistency

- Make mobile auth state a single source of truth.
- Keep `me.emailVerified` handling consistent across auth hydration and routing.
- Remove redundant manual redirects and let route guards own auth navigation.
- Handle deleted logged-in user flow gracefully.

## P1 — Backend Integrity & Robustness

- Add activity reconciliation strategy for derived events.
- Cover empty-database and startup edge cases.
- Introduce clearer domain error mapping for GraphQL responses.
- Harden follow-state mapping for raw/entities length mismatch.
- Add invariants in activity logging inputs (`like` requires target post, `follow` requires target user).

## P2 — API & Service Cleanup

- Revisit followers-with-follow-state return shape naming/contract.
- Decouple user profile lookup from post ordering concerns.
- Remove redundant reads and unneeded defensive checks where contracts are already strict.
- Re-evaluate whether some computed fields should be client-derived.

## P2 — Test & CI

- Add CI automation for backend and mobile test runs.
- Add more screen-level integration tests for feed/profile flows.
- Add navigation behavior tests for profile/link edge cases.

## P2 — Mobile UX/Behavior

- Tighten owner/follow button guard logic in feed/profile views.
- Unify profile tab refresh behavior.
- Smooth loading transitions on web and standardize loading indicators.
- Improve form UX: inline validation while typing, enter-key submit behavior, and disabled save states when no changes exist.
- Add verify-mail escape/back action.

## P3 — Optional Architecture

- Evaluate shared/global DB module strategy (`@Global()`) only if module wiring complexity increases.

## Open Design Questions

- Should profile `me` query ownership stay in auth GraphQL surface?
- Should signup response payload be reduced further (for example remove redundant fields)?
- Should profile settings preserve unsaved edits across tab switches?
