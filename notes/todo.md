# TODO Roadmap — Active Only

### Mobile Refactors
- `feed.tsx`
  - Move activity filter predicate into `useActivities` (or pass as config)
  - Avoid screen-owned functionality rules (`foo().filter(bar)` pattern)
- `username.tsx`
  - Refactor into a tab coordinator
  - Keep profile info on screen
  - Own only active tab state
  - Posts/Likes → `ActivityList` + `useActivities(types)`
  - Followers/Following → `UserList` + `useFollow`
- Rename `useactivityrow` → `useactivity`
- Fix/change `fetchgetProfileFollowersView` naming in `client.ts`



## P2 — Mobile UX / Behavior

- Add optimistic post creation flow: local row + reconcile/rollback
- On login/signup, show all errors/missing fields at once and highlight them


## P3 — Testing & Tooling

### Testing / CI
- Add CI for backend + mobile tests
- Add integration tests for feed/profile flows
- Add navigation tests for profile/link edge cases

### Code Quality / Audits
- Set linter: `eslint-plugin-react-hooks` exhaustive-deps
- Audit `graphqlFetch.tsx`
- Audit `token.tsx`


## Later

- Revisit mobile token storage strategy
- Add activity reconciliation for derived events
- Evaluate shared/global DB module strategy (`@Global()`) — only if needed
- Build migration-first DB workflow
- Use shared user type on mobile
- Unify patterns in `client.ts`


# Open Questions — Design

- Should `me` query live in the auth GraphQL surface?
- Feed comment cards:
  - Post context + highlighted comment + thread affordance?
- Should GraphQL client validate responses at runtime (Zod/Valibot)?
- Should cross-service mutation payloads be minimal (IDs only) to reduce coupling?
- Current issue: The verification token is committed before the email is sent. If SMTP fails, the user may be throttled despite never receiving the email.
  Possible solutions:
  - Accept this tradeoff (current behavior)
  - Use an outbox pattern with retries
  - Invalidate the new token if sending fails
  - Throttle based on successful sends rather than token creation