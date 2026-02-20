# Nest GraphQL Apollo — Social Feed Monorepo

Full-stack social feed MVP built as a monorepo:

- **Backend:** NestJS + Apollo GraphQL + TypeORM + PostgreSQL
- **Mobile:** Expo React Native app (Expo Router)

The product domain is Twitter-like behavior: auth, profiles, posts, likes, follows, and an activity feed.

## Monorepo Layout

```text
backend/   NestJS GraphQL API + PostgreSQL persistence
mobile/    Expo app (auth + feed + profile flows)
notes/     project scratchpad (bugs/dev diary/todo)
```

## Docs Map

- Root overview: [./readme.md](./readme.md)
- Backend details: [./backend/README.md](./backend/README.md)
- Mobile details: [./mobile/README.md](./mobile/README.md)
- Working notes: [./notes/todo.txt](./notes/todo.txt), [./notes/dev diary.md](./notes/dev%20diary.md), [./notes/notes.txt](./notes/notes.txt), [./notes/bugs.txt](./notes/bugs.txt)

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL running locally

### 1) Install dependencies

At root:

```bash
npm install
```

Then per app:

```bash
cd backend && npm install
cd ../mobile && npm install
```

### 2) Configure environment

Backend reads `JWT_SECRET` (and `PORT` optionally) from env.

Mobile requires:

- `EXPO_PUBLIC_API_URL` (GraphQL endpoint URL)

Example GraphQL endpoint for local dev:

```text
http://localhost:3000/graphql
```

### 3) Run both apps together

From root:

```bash
npm run dev
```

This runs backend + Expo concurrently.

## Root Scripts

- `npm run dev` — run backend and mobile concurrently
- `npm run dev:backend` — run Nest backend in watch mode
- `npm run dev:mobile` — run Expo dev server

## Backend Overview (`backend/`)

### Stack

- NestJS 11
- Apollo GraphQL (code-first schema)
- TypeORM 0.3 + PostgreSQL
- JWT auth with Passport strategy and GraphQL guard

### Modules

- `users`
- `auth`
- `posts`
- `follows`
- `activity`

### Domain model

- **User**: unique username, optional profile fields, post/follow relations
- **Post**: text content + author relation
- **Like**: unique (user, post) with `active` soft-toggle semantics
- **Follow**: unique (follower, following)
- **Activity**: denormalized feed event model (`post`, `follow`, `like`, `share`) with `active`

### GraphQL surface (high level)

- Auth: `signUp`, `login`, `me`
- Posts: `posts`, `post`, `likedPosts`, `addPost`, `deletePost`, `likePost`, `unlikePost`
- Users/Profile: `userByUsername`, `followedByMe`, `followersCount`, `followingCount`
- Follows: `followUser`, `unfollowUser`, follower/following queries (+ follow-state variants)
- Feed: `feed(username?, types?)`

### Current behavior notes

- Like/unlike and follow/unfollow are idempotent.
- Activity entries are updated transactionally during like/follow/post operations.
- Feed excludes inactive like/follow events.
- Post deletion clears associated activity entries.

## Mobile Overview (`mobile/`)

### Navigation

- Expo Router route groups:
  - `(auth)`: login, sign-up
  - `(app)`: feed and profile

### State/data flow

- Hook-driven state (`useActivities`, `useProfile`, `useAuth`)
- `graphqlFetch` utility with bearer token injection
- Optimistic UI updates for like/follow/delete; refresh-on-error fallback

### Core user flows

- Login / sign-up
- Feed compose + activity interactions
- Profile tabs (posts, likes, activity, followers, following)

## Testing

- Backend: Jest setup + coverage scripts
- Mobile: Jest tests (currently utility-focused, e.g. GraphQL fetch)

Common commands:

```bash
cd backend && npm test
cd backend && npm run test:cov
cd mobile && npm test
```

## Known Gaps / Tech Debt

- Passwords are currently plaintext (must be hashed).
- JWT secret is logged during auth module init (should be removed).
- DB credentials are currently hardcoded in backend config.
- Token storage approach is acceptable for web, weaker for native device security.
- Some docs/files are still being aligned with implementation.

## Practical Status

This is a strong MVP with clean domain boundaries and working optimistic UX.

Current phase is **active development**, not production hardening.

If the next milestone is ship-ready, prioritize:

1. Security hardening
2. Env/config cleanup
3. Auth/state unification
