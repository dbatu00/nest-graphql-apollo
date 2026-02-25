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

---

## 2025-11-30 — Mock typing note

`findOne: jest.Mock<Promise<T | null>, [any]>;`

Why keep it:

- Type-checks mock argument shape.
- Flags wrong argument usage early.
- Helps larger test suites stay safer.

---

## 2026-01-12 — Post author shape in GraphQL

Question: return only `user_id` on `Post`, or expose `user`?

Decision: expose `user` directly in GraphQL.

Reasoning:

- GraphQL models domain relationships, not DB foreign keys.
- Backend composes data; clients request only needed fields.
- Keeps DB internals out of public API contracts.

---

## 2026-01-14 — `addPost` return type

Question: if client does not need returned post now, return `Boolean`?

Decision: keep returning `Post`.

Reasoning:

- Stronger API contract
- Better future flexibility
- Immediate UI updates without refetch
- Access to server-generated fields (`id`, `createdAt`)

---

## 2026-02-13 — File cohesion and data model

- Prefer cohesive files over premature splitting.
- Keep core tables as-is: `User`, `Auth`, `Post`, `Like`, `Follow`, `Activity`.
- `Like` remains interaction source of truth.
- `Activity` remains denormalized feed read model.

---

## 2026-02-14 — Activity and contract decisions

- Keep `username` in API contracts for readability.
- Keep controlled type branching in `ActivityService` for current scope.
- Keep explicit follow/unfollow mutations for clarity.

---

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

---

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

---

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

---

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

---

## 2026-02-26 — Why email-link resend is in controller, app resend is in resolver

Decision boundary:

- Email link click (`/auth/verify-email?token=...`) is a browser URL entry-point, so it belongs in an HTTP controller.
- In-app resend is an authenticated app/API action, so it belongs in GraphQL resolver flow.

Reasoning:

- Controllers are the clean fit for external link-based flows (email verify, reset links, webhooks).
- Resolvers are the clean fit for authenticated client operations already living in app GraphQL contracts.
- This split keeps UX behavior consistent while preventing resolver contracts from carrying browser-link concerns.
