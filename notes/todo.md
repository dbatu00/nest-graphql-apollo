# TODO Roadmap

## P0 — Security & Configuration (Ship Blockers)

- [ ] Hash passwords (bcrypt/argon2) instead of storing plain text.
- [ ] Remove JWT secret logging from auth module startup.
- [ ] Move hardcoded DB credentials to environment variables.
- [ ] Add environment validation for required secrets/URLs.
- [ ] Revisit token storage strategy for native mobile targets.

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

## P2 — API/Service Cleanup

- [ ] Extract GraphQL query strings for readability.
- [ ] Review resolver `async` usage consistency.
- [ ] Revisit `getFollowersWithFollowStat` return shape.
- [ ] Move profile post loading from `findByUsername` to `@ResolveField()`.
- [ ] Decouple `UsersService.findByUsername()` from post ordering.
- [ ] Remove redundant reads and unnecessary defensive checks.
- [ ] Re-evaluate whether `likedByMe` should be client-derived.
- [ ] Re-evaluate whether `active` is necessary in like/follow entities.

## P2 — Mobile UX/Behavior

- [ ] Tighten `postItem` `isOwner` and `canFollow` checks.
- [ ] Fix profile activity follow button accuracy/behavior.
- [ ] Verify tab refresh behavior on refresh vs tab switch.
- [ ] Add infinite scroll.

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
