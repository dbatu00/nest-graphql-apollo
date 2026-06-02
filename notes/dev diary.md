# Dev Diary

## 2025-11-27 — Resolver Test to Architecture Cleanup

**Topic:** resolver error handling and refactor away from `findUser(idOrName)`.

### What happened

- Positive resolver test passed.
- Negative resolver test failed with a different error than expected.

### Root cause

- Resolvers were making direct DB calls.
- Error handling was inconsistent across resolver methods.
- `findUser(idOrName)` had type-based branching and mixed responsibilities.

### Decision

- Removed ambiguous `findUser(idOrName)`.
- Added explicit methods:
  - `findUserById(id: number)`
  - `findUserByName(name: string)`
- Removed direct DB calls from resolvers.

### Outcome

- Predictable resolver tests
- Clearer service boundaries
- Better long-term maintainability


## 2026-03-10 — Service Layer Defensive Checks

**Topic:** Redundancy vs defensive practice in user checks

### What happened

- Noticed that user existence checks in `auth.service.ts` are often redundant due to `GqlAuthGuard` and `@CurrentUser` in resolvers.

### Reasoning

- While guards/decorators ensure authenticated access, service methods may be reused elsewhere (other controllers/services/tests).
- Defensive checks in the service layer prevent misuse and unexpected errors, making the code more robust and future-proof.

### Decision

- Keep defensive checks in service methods for layered architecture and maintainability, even if currently redundant for resolver flow.

## 2025-11-30 — Mock typing note

`findOne: jest.Mock<Promise<T | null>, [any]>;`

Why keep it:

- Type-checks mock argument shape.
- Flags wrong argument usage early.
- Helps larger test suites stay safer.

## 2026-01-12 — Post author shape in GraphQL

Question: return only `user_id` on `Post`, or expose `user`?

Decision: expose `user` directly in GraphQL.

Reasoning:

- GraphQL models domain relationships, not DB foreign keys.
- Backend composes data; clients request only needed fields.
- Keeps DB internals out of public API contracts.

## 2026-01-14 — `addPost` return type

Question: if client does not need returned post now, return `Boolean`?

Decision: keep returning `Post`.

Reasoning:

- Stronger API contract
- Better future flexibility
- Immediate UI updates without refetch
- Access to server-generated fields (`id`, `createdAt`)

## 2026-02-13 — File cohesion and data model

- Prefer cohesive files over premature splitting.
- Keep core tables as-is: `User`, `Auth`, `Post`, `Like`, `Follow`, `Activity`.
- `Like` remains interaction source of truth.
- `Activity` remains denormalized feed read model.

## 2026-02-14 — Activity and contract decisions

- Keep `username` in API contracts for readability.
- Keep controlled type branching in `ActivityService` for current scope.
- Keep explicit follow/unfollow mutations for clarity.

## 2026-02-21 — Activity feed vs post feed, and hard-delete cleanup

Question: keep both `getActivityFeed` and `getFeed`, and can hard-delete cleanup be merged into `logActivity`?

Decision:

- Keep both read methods because they represent different read models.
  - `getFeed` = canonical post list.
  - `getActivityFeed` = event timeline (post/follow/like) with activity-specific filters.
- Keep hard-delete cleanup separate from event logging.
  - `logActivity` handles append/upsert semantics (including soft-delete flips for like/follow via `active`).
  - hard-delete entities (like post deletion) should use explicit purge behavior.

`getPosts` / `getFeed` decision:

- Keep a dedicated post-list read path (`getFeed` now; `getPosts` naming is acceptable if you want endpoint naming symmetry).
- Do not replace post reads with activity reads.
- Reason: post screens need a stable canonical source independent from activity-specific filtering and event semantics.

Implementation note:

- If more hard-delete entities are added later (for example comments), prefer a typed purge helper (example: `purgeActivitiesByTarget`) and keep `deleteActivitiesForPost` as a thin wrapper.
- Do not merge purge and logging into one “super” write method; it makes intent less clear and tests harder to reason about.

## 2026-02-25 — Auth hardening (email verification MVP)

Decisions implemented:

- Removed legacy plaintext-password fallback at login.
  - Login now accepts only Argon2-hashed credentials.
  - Reason: avoids silent downgrade paths and removes mixed credential semantics.



- Added unique constraint for verification token hash.
  - `verification_tokens.tokenHash` is now unique/indexed.
  - Reason: removes collision ambiguity and strengthens token lookup guarantees.

- Standardized verification-token failures to one client-safe message.
  - “Invalid, expired, or already-used verification token”
  - Reason: simple and consistent UX without leaking token state detail.

## 2026-02-25 — Verification delivery via SMTP

Decision:

- Move from token-only dev verification toward actual email delivery.

Implementation direction:

- Added SMTP-backed verification sender in backend signup flow.
- If SMTP is configured, verification token is sent via email and omitted from API payload.
- If SMTP is not configured, backend keeps a dev fallback by logging token for local testing.

Why this helps now:

- Keeps MVP velocity while allowing realistic end-to-end verification testing.
- Supports testing many local users through MailHog/Mailpit without real inbox management.

## 2026-02-26 — Verification resend throttling notes

Current behavior (agreed shape):

- Expired verification link click attempts resend.
- If resend passes throttle, user sees "expired + resent".
- If resend is throttled, user gets a throttle message.
- In-app resend still goes through the same verification throttle checks.

Malicious idea considered:

- Large-scale abuse scenario (for example mass-created accounts all triggering verification resend) is realistic enough to plan for.

How to track + reset (current stage):

- DB-backed token events are acceptable at this product stage.
- Reset is time-based by design: rolling windows naturally cool down as records age out of window checks.
- Throttle state is not manually "reset" in normal flow; it decays automatically over time.

Scale path (later):

- Move hot-path counters to Redis/token-bucket style limits.
- Keep DB for audit/history and add analytics events for abuse monitoring.

## 2026-02-26 — Why email-link resend is in controller, app resend is in resolver

Decision boundary:

- Email link click (`/auth/verify-email?token=...`) is a browser URL entry-point, so it belongs in an HTTP controller.
- In-app resend is an authenticated app/API action, so it belongs in GraphQL resolver flow.

Reasoning:

- Controllers are the clean fit for external link-based flows (email verify, reset links, webhooks).
- Resolvers are the clean fit for authenticated client operations already living in app GraphQL contracts.
- This split keeps UX behavior consistent while preventing resolver contracts from carrying browser-link concerns.

## 2026-02-27 — Keep `emailVerified` in signup payload

Question:

- Is `emailVerified: user.emailVerified` in signup return unnecessary?

Decision:

- Keep it in the signup payload.

Reasoning:

- Maintains a stable `AuthPayload` shape across both `signUp` and `login`.
- Keeps frontend auth flow generic and simpler (single payload contract).
- Future-proofs edge cases where verification state at signup may differ from default assumptions.

## 2026-02-27 — Config getter helpers in auth service

Question:

- Are dedicated getter methods for auth/env values overkill?

Decision:

- Keep explicit getters plus numeric validation helpers.

Reasoning:

- Centralizes runtime validation at read points.
- Avoids repetitive parse/guard code at each call site.
- Improves strict TypeScript narrowing for config values (`number | undefined` to validated `number`).

## 2026-02-27 — Email send outside DB transaction

Question:

- Should `sendVerificationEmail(...)` be part of DB transaction?

Decision:

- Keep SMTP send outside DB transaction.

Reasoning:

- Email delivery is external I/O and can be slow/unreliable.
- Holding DB transactions during SMTP increases lock time and failure blast radius.
- Current approach uses post-commit send with compensation handling for resend delivery failures.

## 2026-02-28 — Transient logout fix in mobile auth refresh

Problem observed:

- Any `getCurrentUser()` failure became `null`, and `refreshAuth()` treated `null` as invalid session.
- Result: temporary network/backend issues could clear token and force logout.

Decision:

- Split current-user failures into two categories:
  - auth-invalid failures (unauthorized/forbidden/token/jwt-like messages) -> return `null`
  - transient failures (network/server/etc.) -> throw
- In `refreshAuth()`, only clear token on auth-invalid (`null`) response.
- On transient failure, keep existing session and return last known user.

Implementation notes:

- `mobile/utils/currentUser.tsx` now rethrows transient failures.
- `mobile/hooks/useAuth.tsx` now catches transient failures and preserves session via a `useRef` snapshot (`userRef.current`).

## 2026-04-26 — Optimistic comment delete race note

Scenario:

- User deletes a comment optimistically in feed state.
- Around the same moment, the parent post may be deleted elsewhere.

Behavior and decision:

- Local optimistic update removes the comment from matching post rows immediately.
- If backend delete returns "Comment not found" because post/comment was already removed, treat it as an expected race outcome.
- Keep `refresh()` fallback on mutation failure to reconcile with server truth.

Why:

- Preserves fast UI response.
- Maintains eventual consistency without client crashes.
- Makes concurrent delete paths predictable.

Outcome:

- Invalid/expired tokens still log out correctly.
- Temporary outages no longer cause forced logout.
## 2026-03-13 — Verification send failure UX tradeoff

Reviewed email verification flow for new signups.

Current behavior: token is created in DB regardless of email delivery success. If delivery fails, user sees “verify your email” screen but may not receive mail until they click resend.

UX tradeoff noted: could expose delivery failures explicitly, but that adds complexity with little practical benefit.

Decision: keep current fire-and-forget behavior for simplicity; logs capture failures for internal tracking.

Frontend can still show resend option, which resolves missed deliveries.

## 2026-03-15 — Email change cooldown leak fix
Found that changeMyEmail was leaking password validity during cooldown — wrong password got a 401, correct password got a 429. Moved the throttle check before the password verify to fix it.

## 2026-04-26 — Polymorphic likes for comments feature

**Topic:** How to design likes when multiple entity types need to be likeable (posts, comments, future story inline comments, etc.)

### Options considered

- **Table-per-type:** separate `PostLike`, `CommentLike` entities. Strong FK integrity, easy to reason about individually. But every new likeable type requires a new entity, repo, migration, and injection. Would also require a `UNION` query for "everything a user liked".
- **Polymorphic (single table):** one `Like` entity with `targetType` (enum) and `targetId` (number). Generic service works for all targets forever. No new tables when adding new likeable types. Matches the existing `Activity` entity pattern already in the codebase.
- **Nullable multi-FK:** rejected early — awkward schema with always-empty columns.

### Decision

Polymorphic. Reasons:

- Future scope includes posts, comments, story inline comments — N targets makes table-per-type accumulate boilerplate.
- Activity entity already uses this pattern (`targetPostId`, `targetUserId` nullable FKs moving toward same idea). Keeping likes consistent with it reduces cognitive overhead.
- The only trade-off is no DB-level FK cascade delete. Acceptable — delete logic is already handled in transactions (same pattern as `deleteActivitiesForPost`).

### Architecture

- `LikesService` is pure data: `like`, `unlike`, `getLikeMeta`, `getUsersWhoLiked`, `getActiveLikesByUser`. No side effects, no domain knowledge.
- Domain services (`PostsService`, future `CommentsService`) orchestrate: call `LikesService` for the DB write, then call `ActivityService` to log it. This keeps `LikesService` generic and prevents it from taking on cross-cutting concerns.
- `LIKE_TYPE` constant (`post`, `comment`, ...) mirrors `ACTIVITY_TYPE` convention.

## 2026-06-03 — Keeping like_type instead of refactoring to activity-based targets

**Question:** Should likes reference `activityId` instead of using `targetType` + `targetId`?

**Options considered**

- **Current:** `Like` table uses `(targetType: enum, targetId: number)`. Callers pass `LIKE_TYPE.POST` or `LIKE_TYPE.COMMENT`. No activity lookup required for like operations.
- **Refactor:** Change `Like` to `targetActivityId` foreign key. Callers pass only `postId` or `commentId`; `LikesService` resolves the activity row, then upserts the like.

**Tradeoffs**

- **Current cost:** Callers pass a redundant type parameter (but it's explicit and simple).
- **Refactor cost:** One extra `activity` table lookup per like/unlike, plus cross-domain coupling (likes needing to know about activity internals for target resolution).

**Decision:** Keep `like_type`.

**Reasoning:**

- For a demo app at current scale, avoiding extra reads is cleaner than "purer" architecture.
- Activity logging already performs its own lookups for dedupe; no need to add lookup cost to the like operation itself.
- Keeping type explicit in the API prevents caller ambiguity and makes error handling simpler.
- Future scaling (event-driven, async activity logging) can decouple this later without data migration risk.
- Does not corrupt activity table: activity table is fed on-demand by `logActivity`, never auto-populated by likes. No dangling references.
