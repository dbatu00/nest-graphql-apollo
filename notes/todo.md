# TODO Roadmap (Active Only)

This file tracks only open work. Completed items are intentionally removed.

---

# P0 — Critical Fixes (Correctness + Data Integrity + Config)

- Fix follow-state mapping bug:
  - `getFollowersWithFollowState` / `getFollowingWithFollowState`
  - `getRawAndEntities()` is not correctly zipped back into entities
  - Risk: `followedByMe` desync when raw/entities lengths diverge due to joins

- Fix activity corruption in `_executeLogActivity`:
  - Falls through to generic `repo.save()` when:
    - `like` has no target post/comment
    - `follow` has no target user
  - Produces invalid activity rows with missing targets
  - Add early validation guards

---

# P1 — Core System Consistency (Auth + Backend Rules)

## Auth State

- Audit all `await` calls for error handling and safe state ordering
- Fix `useAuth.setSession`:
  - set user state first (sync)
  - then persist token (async)
- Remove `getMyProfile` fetch from `useActivities`
  - source identity from `useAuth`
- Make mobile auth state single source of truth
- Keep `me.emailVerified` consistent across hydration + routing
- Remove redundant manual redirects → route guards handle navigation
- Handle deleted-user session gracefully

## Backend consistency

- Add activity reconciliation for derived events
- Cover empty DB + startup edge cases
- Define GraphQL error propagation rules (bubble vs swallow, rollback expectations)
- Require `EntityManager` for shared write APIs (Likes/Activity services)
- Add invariants:
  - like → requires target post/comment
  - follow → requires target user
- Re-evaluate follow-state consistency under join duplication issues

---

# P2 — API Shape + Cleanup + Tests

## API / GraphQL

- Replace `types?: string[]` with shared `ActivityType` enum
- Revisit `followers-with-follow-state` contract (naming + design)
  - unclear follow module behavior
- Decide which computed fields should be client-derived
- Remove redundant reads / defensive checks where contracts are strict

## Testing / CI

- Add CI for backend + mobile tests
- Add integration tests for feed/profile flows
- Add navigation tests for profile/link edge cases

---

# P2 — Mobile UX / Behavior

- Fix router `as never` coercions (type safety broken)
- Add optimistic post creation flow (local row + reconcile/rollback)
- Tighten owner/follow button logic in feed/profile
- Unify profile tab refresh behavior
- Improve loading states (web + mobile consistency)
- Improve form UX:
  - inline validation
  - enter submit
  - disable save when unchanged
- Add verify-email escape/back flow
- Hide self-activity except posts

---

# P3 — Architecture (Only if needed)

- Evaluate shared/global DB module strategy (`@Global()`)

---

# Pre-Production

- Build migration-first DB workflow

---

# Later

- Revisit mobile token storage strategy

---

# Open Questions (Design)

- Should `me` query live in auth GraphQL surface?
- Should signup payload be reduced further?
- Should profile settings persist unsaved edits across tabs?
- Feed comment cards:
  - post context + highlighted comment + thread affordance?
- Should GraphQL client validate responses at runtime (zod/valibot)?
- Should cross-service mutation payloads be minimal (IDs only) to reduce coupling?