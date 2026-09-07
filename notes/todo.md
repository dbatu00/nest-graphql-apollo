# TODO Roadmap (Active Only)
This file tracks only open work. Completed items are intentionally removed.


# P1 — Core System Consistency (Auth + Backend Rules)

## Auth State


- Fix `useAuth.setSession`:
  - set user state first (sync)
  - then persist token (async)
- Keep `me.emailVerified` consistent across hydration + routing

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
- on login/signup show all errors/missing fields at once and highlight
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
- Feed comment cards:
  # TODO Roadmap (Active Only)
  This file tracks only open work. Completed items are intentionally removed.

  ## P1 — Core Consistency (Ship-Blockers)

  ### Auth state
  - Fix `useAuth.setSession` ordering:
    - set user state first (sync)
    - then persist token (async)
  - Keep `me.emailVerified` consistent across hydration + routing

  ### Backend consistency
  - Add activity reconciliation for derived events
  - Cover empty DB + startup edge cases
  - Define GraphQL error propagation rules (bubble vs swallow, rollback expectations)
  - Require `EntityManager` for shared write APIs (Likes/Activity services)
  - Add invariants:
    - like → requires target post/comment
    - follow → requires target user
  - Re-evaluate follow-state consistency under join duplication issues
  - Check `likeComment` transaction note:
    - verify whether `postExists` is redundant due to FK constraint on locked comment

  ### Mobile behavior correctness
  - Fix router `as never` coercions (type safety broken)
  - Add optimistic post creation flow (local row + reconcile/rollback)
  - On login/signup, show all errors/missing fields at once and highlight
  - `ActivityRow / ActivityBanner`: remove unjustified defensive chaining where schema guarantees non-null/non-empty
  - `commentInputWrapperFocused`: focused style currently matches unfocused background; add a visible focus difference

  ---

  ## P2 — Refactor + API Cleanup

  ### API / GraphQL shape
  - Replace `types?: string[]` with shared `ActivityType` enum
  - Decide which computed fields should be client-derived
  - Remove redundant reads / defensive checks where contracts are strict

  ### Mobile refactors
  - `feed.tsx`:
    - move activity filter predicate into `useActivities` (or pass as config)
    - avoid screen-owned feed business logic (`foo().filter(bar)` pattern)
  - `username.tsx` refactor into tab coordinator:
    - keep profile info on screen
    - own only active tab state
    - Posts/Likes → `ActivityList` + `useActivities(types)`
    - Followers/Following → `UserList` + `useFollow`
  - `useActivities.tsx`:
    - move relationship logic (follow/unfollow) into `useFollow`
    - avoid two optimistic follow implementations drifting out of sync
  - Rename `useactivityrow` → `useactivityinteractions`
  - Unify patterns in `client.ts`
  - `fetchgetProfileFollowersView`: fix/change naming in `client.ts`
  - Use shared user type on mobile

  ---

  ## P3 — Testing / Tooling
  - Add CI for backend + mobile tests
  - Add integration tests for feed/profile flows
  - Add navigation tests for profile/link edge cases
  - Set linter: `eslint-plugin-react-hooks` exhaustive-deps
  - Audit `graphqlFetch.tsx`
  - Audit `token.tsx`

  ---

  ## P4 — Pre-Production
  - Build migration-first DB workflow

  ---

  ## Later
  - Revisit mobile token storage strategy

  ---

  ## Open Questions (Design)
  - Should `me` query live in auth GraphQL surface?
  - Feed comment cards:
    - post context + highlighted comment + thread affordance?
  - Should GraphQL client validate responses at runtime (zod/valibot)?
  - Should cross-service mutation payloads be minimal (IDs only) to reduce coupling?

  ---

  ## Decision TODO — Email Verification Delivery Failure
  The verification token is committed before the email is sent. If SMTP fails, the user may be throttled despite never receiving the email.

  Possible solutions:
  - Accept this tradeoff (current behavior)
  - Use an outbox pattern with retries
  - Invalidate the new token if sending fails
  - Throttle based on successful sends instead of token creation
