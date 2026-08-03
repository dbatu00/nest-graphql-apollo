# TODO Roadmap (Active Only)
This file tracks only open work. Completed items are intentionally removed.


# P1 — Core System Consistency (Auth + Backend Rules)

## Auth State


- Fix `useAuth.setSession`:
  - set user state first (sync)
  - then persist token (async)
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
- on login/signup show all errors/missing fields at once and highlight
- audit all screens for behaviour when window is squeezed
- handle token expiration gracefully
- on empty profile tabs : "nothing to show yet"
- audit settings.tsx
- audit hooks
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


set linter:
slint-plugin-react-hooks's exhaustive-deps

feed.tsx:
- Move inline composer card style block into Composer (or a shared style/theme
  constant) so Feed doesn't own presentation details like shadows/border radius
- Move activity filter predicate (a.type !== "follow" || a.active) into
  useActivities (e.g. feed.visibleActivities) or pass as config to ActivityList,
  so Feed doesn't own feed business logic
  --aka instead of foo().filter(bar), expose common filtered views

username.tsx:
- Refactor into a tab coordinator:
  - Keep profile info on the screen
  - Own only the active tab state
  - Posts/Likes → ActivityList + useActivities(types)
  - Followers/Following → UserList + useFollow

useActivities.tsx:
- Move relationship logic (follow/unfollow) into useFollow so activity and
  relationship concerns are owned separately (same underlying point as
  username.tsx's last TODO — avoid two independent optimistic-follow
  implementations drifting out of sync)


useAuth.tsx:
- Wrap clearToken() in try/catch in logout() and refreshAuth()'s
  !currentUser branch so setUser(null) still runs if storage fails
- Confirm whether refreshAuth()'s !currentUser branch is actually reachable
  given backend auth guards; remove it or document it as defensive-only
- Consider blocking authenticated route rendering in AuthGate until loading
  resolves to eliminate the cold-start flash
  -- useAuth.tsx:
- Cold-start transient-failure gap: if getCurrentUser() fails on the very
  first refreshAuth() call (app launch), userRef.current is still null
  (no prior session in memory), so a valid stored token gets treated as
  "logged out" even though nothing about the session was actually invalid.
  Add a retry (e.g. on regaining network connectivity, or a bounded
  retry/backoff before giving up) instead of silently falling through to
  logged-out state on the very first failure.


-ActivityRow / ActivityBanner:
- Remove unjustified defensive chaining on fields the schema guarantees
  non-null/non-empty: actor.username, targetUser.username (once targetUser
  itself is confirmed present), targetPost.user.username (pending
  confirmation of Post's type) — these are enforced at the DB column level
  (unique, non-nullable), not just the TS type level. Keep only the
  genuinely optional checks: targetUser existing at all, targetPost
  existing at all.
-commentInputWrapperFocused sets backgroundColor: color.bgComment, which is identical to the unfocused wrapper's background. Right now focusing the comment input has no visible effect. Probably meant to add a border color or shadow.



check nullabilities and fallbacks app wide



### TODO: Handle email send failure after token creation

The verification token is committed before the email is sent. If SMTP fails, the user may be throttled despite never receiving the email.

Possible solutions:
- Accept this tradeoff (current behavior).
- Use an outbox pattern with retries.
- Invalidate the new token if sending fails.
- Throttle based on successful sends instead of token creation.


async likeComment(userId: number, commentId: number): Promise<boolean> {
        try {
            return await this.commentsRepo.manager.transaction(async manager => {
                const userExists = await manager.exists(User, { where: { id: userId } });
                const comment = await lockEntityByIdOrThrow(manager, Comment, 'comment', commentId, ['user'], 'Comment not found');
                const postExists = await manager.exists(Post, { where: { id: comment?.postId } });

                postexists probabaly redundant due to fk coınstraint on comment which gets locked


lightweight client validation for signup fields


 rename: useactivityrow -> useactivityinteractions

 unify patterns in client.ts

 audit graphgqlfetch.tsx

 audit token.tsx

 fetchgetProfileFollowersView fix/change naming. client.ts

 unify header styles

 use user type on mobile