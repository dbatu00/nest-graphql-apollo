# TODO Roadmap (Active Only)

This file tracks only open work. Completed items are intentionally removed.

## P0 — Security & Configuration

- Add stricter environment validation for required secrets and URLs.
- Revisit mobile token storage strategy for native devices.
- Complete migration-first DB workflow and disable schema sync outside local development.

## P1 — Auth & State Consistency

- Audit all `await` calls for error handling and safe state ordering (e.g., feed.publish clears state even on failure).
- Fix `useAuth` setSession: set user state first (sync), then save token (async) to prevent inconsistency if token save fails.
- Remove `getMyProfile` fetch from `useActivities`; source current-user identity from `useAuth` in feed-level wiring (avoid duplicate auth source, keep profile usage lean).
- Make mobile auth state a single source of truth.
- Keep `me.emailVerified` handling consistent across auth hydration and routing.
- Remove redundant manual redirects and let route guards own auth navigation.
- Handle deleted logged-in user flow gracefully.

## P1 — Backend Integrity & Robustness

- Add activity reconciliation strategy for derived events.
- Cover empty-database and startup edge cases.
- Harden `LikesService.like` for concurrent requests (handle unique-violation idempotently or switch to atomic upsert).
- Introduce clearer domain error mapping for GraphQL responses.
- Document and standardize service-error propagation rules for GraphQL resolvers (bubble vs swallow, rollback expectations).
- Consolidate likes cleanup behind a single `deleteLikes` helper.
- Require `EntityManager` for shared write APIs in `LikesService`/`ActivityService`, while keeping read APIs simple/manager-optional.
- Harden follow-state mapping for raw/entities length mismatch.
- Add invariants in activity logging inputs (`like` requires target post, `follow` requires target user).
- [Ponder] Link comment likes to activity events (for richer timeline, notifications, or analytics?)

## P2 — API & Service Cleanup

- Optimize `likePost` / `unlikePost` / `likeComment` / `unlikeComment`: replace `.findOne()` with `.exists()` for user/post/comment validation (cheaper query, same validation result).
- Remove ActivityResolver from root module providers (already in ActivityModule). Keep APP_GUARD there — global guards belong at root, but resolvers belong in their feature modules.
- Replace loose `types?: string[]` feed params with a shared `ActivityType[]` union/enum across hook + GraphQL client boundaries.
- Revisit followers-with-follow-state return shape naming/contract.
- Decouple user profile lookup from post ordering concerns.
- Remove redundant reads and unneeded defensive checks where contracts are already strict.
- Re-evaluate whether some computed fields should be client-derived.

## P2 — Test & CI

- Add CI automation for backend and mobile test runs.
- Add more screen-level integration tests for feed/profile flows.
- Add navigation behavior tests for profile/link edge cases.

## P2 — Mobile UX/Behavior

- Remove type coercions (`as never`) in router calls — indicates routing type safety is broken. Fix the route or type registration.
- Add optimistic create-post flow (temporary local post row + rollback/reconcile) for parity with other optimistic mutations.
	- Note: current `addPost` returns `id`, but publish path mainly refreshes; either use `id` for optimistic reconciliation or simplify return contract.
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
- For comment activity cards, should feed show both post context and highlighted comment (including reply context + "view thread" affordance)?
- Should we add runtime response-shape validation at GraphQL client boundaries (e.g., zod/valibot) to protect against backend schema drift beyond TypeScript compile-time types?
- Should cross-service mutation payloads be slimmed to minimal IDs/flags instead of passing full entities (to reduce coupling and hidden data dependencies)?
- Should like cleanup explicitly coordinate activity cleanup, or should that responsibility remain on Post/Comment deletion via cascade semantics only?


dont show self activity except posts 
Charlie followed you
