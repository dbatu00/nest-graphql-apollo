# TODO Roadmap

## P0 — Security & Configuration (Ship Blockers)

- [ ] Hash passwords (bcrypt/argon2) instead of storing plain text.
- [ ] Remove JWT secret logging from auth module startup.
- [ ] Move hardcoded DB credentials to environment variables.
- [ ] Add environment validation for required secrets/URLs.
- [ ] Revisit token storage strategy for native mobile targets.
- [ ] Disable `synchronize: true` outside local dev and move to migrations workflow.

## P1 — Auth & State Consistency

- [ ] Make auth state single source of truth (replace simulated root auth flow).
- [ ] Stop passing `currentUserId` around in client hooks.
- [ ] Handle deleted logged-in user gracefully (auth/feed fallback).
- [ ] Add logout and homepage actions on profile.

## P1 — Data Integrity & Backend Robustness

- [ ] Make post deletion transactional.
- [ ] Add reconciliation jobs for derived activity entries (likes/follows).
- [ ] Cover empty-database edge cases (including missing `auth` table).
- [ ] Introduce custom error classes and map to GraphQL-safe responses.
- [ ] Use `try/catch` only for meaningful error conversion.
- [ ] Add input invariants in `ActivityService.logActivity` (`like` requires `targetPost`, `follow` requires `targetUser`).
- [ ] Guard follows resolver follow-state mapping against raw/entities length mismatches.
- [ ] Replace generic thrown `Error` in `ActivityResolver.feed` with framework exception type.

## P2 — API/Service Cleanup

- [x] Extract GraphQL query strings for readability.
- [ ] Review resolver `async` usage consistency.
- [ ] Revisit `getFollowersWithFollowStat` return shape.
- [ ] Move profile post loading from `findByUsername` to `@ResolveField()`.
- [ ] Decouple `UsersService.findByUsername()` from post ordering.
- [ ] Remove redundant reads and unnecessary defensive checks.
- [ ] Re-evaluate whether `likedByMe` should be client-derived.
- [ ] Re-evaluate whether `active` is necessary in like/follow entities.

## P2 — Unit Testing Readiness

- [x] Extract mobile GraphQL operations into shared constants (hooks/components no longer inline query strings).
- [x] Add backend service unit tests (`auth`, `posts`, `follows`, `activity`, `users`) with mocked repositories + mocked dependencies.
- [x] Add backend resolver unit tests (`auth`, `users`, `posts`, `follows`, `activity`) with service-only mocks.
- [x] Add shared backend test helper for repository/dataSource/entity-manager mocks to reduce boilerplate.
- [x] Add hook-level mobile tests for optimistic follow/like behavior (`useActivities`, `useProfile`) with mocked `graphqlFetch`.
- [x] Add component-level mobile test for likes modal flow in `ActivityRow` with mocked `graphqlFetch`.
- [x] Add auth-flow screen tests for `login`, `signUp`, and root `index` redirects.
- [ ] Add CI step to run `backend npm test` + `mobile npm test`.
- [x] Add backend tests covering module config metadata shape (`TypeORM` + `JwtModule.register`).
- [x] Add backend tests capturing follows resolver raw/entities mismatch behavior.
- [x] Add backend tests capturing current `logActivity` invalid-input behavior for missing `targetPost`/`targetUser`.

Backend test status:

- [x] Full backend test pass is currently green (`138 passed, 0 failed` on 2026-02-21).

Frontend test status (mobile, 2026-02-22):

- [x] Utility tests: `graphqlFetch`, `token`, `logout`, `currentUser`.
- [x] Hook tests: `useActivities` (optimistic + rollback/error + guards).
- [x] Hook tests: `useProfile` (load/fetch/toggleFollow optimistic + rollback/error + guards).
- [x] Component tests: `ActivityRow` (likes modal, follow forwarding, close behavior, owner delete wiring, no-like-controls path).
- [x] Screen/route tests: `login`, `signUp`, `index` redirects.
- [ ] Remaining likely gaps: `ProfileLink` navigation timing, feed/profile screen-level integration tests, and CI automation for mobile test runs.

## P2 — Mobile UX/Behavior

- [ ] Tighten `postItem` `isOwner` and `canFollow` checks.
- [ ] Fix profile activity follow button accuracy/behavior.
- [ ] Verify tab refresh behavior on refresh vs tab switch.
- [ ] Add infinite scroll.
- allow entering username or email for login
- on login/signup enter button activates buttons
- decide on web page tab titles

## P3 — Optional Architecture Refactor

- [ ] Consider global DB access module (`@Global()`): https://docs.nestjs.com/modules

## Query optimization note (`getLikedPostsByUsername`)

Current pattern:

```ts
async getLikedPostsByUsername(username: string): Promise<Post[]> {
  const user = await this.usersRepo.findOne({ where: { username } });
  if (!user) throw new NotFoundException('User not found');

  const likes = await this.likesRepo.find({
    where: { userId: user.id, active: true },
    relations: ['post', 'post.user'],
    order: { createdAt: 'DESC' },
  });

  return likes.map(l => l.post);
}
```

Potential alternative:

```ts
const likes = await this.likesRepo
  .createQueryBuilder('like')
  .innerJoin('like.user', 'user')
  .innerJoinAndSelect('like.post', 'post')
  .innerJoinAndSelect('post.user', 'postUser')
  .where('user.username = :username', { username })
  .andWhere('like.active = true')
  .orderBy('like.createdAt', 'DESC')
  .getMany();

return likes.map(l => l.post);
```


------------

get rid of unused fields on query calls made in client
------------
unify profile tab refresh behaviour -> either all refresh on change or none
------------
get rid of jitters on web side loadings with min fix loading time and unify loading icon usage
