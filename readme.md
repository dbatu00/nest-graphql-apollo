# Nest GraphQL Apollo — Social Feed Monorepo

Full-stack social feed MVP built as a monorepo:

- Backend: NestJS + Apollo GraphQL + TypeORM + PostgreSQL
- Mobile: Expo React Native app (Expo Router)

The domain is Twitter-like behavior: auth, profiles, posts, likes, follows, and an activity feed.

## Monorepo Layout

```text
backend/   NestJS GraphQL API + PostgreSQL persistence
mobile/    Expo app (auth + feed + profile flows)
notes/     scratchpad docs (bugs/dev diary/todo/notes)
```

## Docs Map

- Root overview: [./readme.md](./readme.md)
- Backend details: [./backend/README.md](./backend/README.md)
- Mobile details: [./mobile/README.md](./mobile/README.md)
- Working notes:
  - [./notes/todo.txt](./notes/todo.txt)
  - [./notes/dev diary.md](./notes/dev%20diary.md)
  - [./notes/notes.txt](./notes/notes.txt)
  - [./notes/bugs.txt](./notes/bugs.txt)

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

Backend requires:

- `JWT_SECRET`
- `PORT` (optional, defaults to `3000`)

Mobile requires:

- `EXPO_PUBLIC_API_URL` (GraphQL endpoint URL)

Example local endpoint:

```text
http://localhost:3000/graphql
```

### 3) Run both apps

From root:

```bash
npm run dev
```

This starts backend and mobile concurrently.

## Root Scripts

- `npm run dev` — run backend and mobile concurrently
- `npm run dev:backend` — run Nest backend in watch mode
- `npm run dev:mobile` — run Expo dev server

## Backend Overview

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

### GraphQL Surface (High-Level)

- Auth: `signUp`, `login`, `me`
- Posts: `posts`, `post`, `likedPosts`, `addPost`, `deletePost`, `likePost`, `unlikePost`
- Users/Profile: `userByUsername`, `followedByMe`, `followersCount`, `followingCount`
- Follows: `followUser`, `unfollowUser`, follower/following queries (+ follow-state variants)
- Feed: `feed(username?, types?)`

### Behavior Notes

- Like/unlike and follow/unfollow are idempotent.
- Activity entries are updated during post/like/follow writes.
- Feed excludes inactive follow/like events.
- Post deletion clears related activity entries.

## Mobile Overview

### Navigation

- Expo Router route groups:
  - `(auth)`: login, sign-up
  - `(app)`: feed and profile

### State/Data Flow

- Hook-driven state (`useActivities`, `useProfile`, `useAuth`)
- `graphqlFetch` wrapper with bearer token injection
- Optimistic updates for follow/like/delete with refresh-on-error fallback

### Core User Flows

- Login / sign-up
- Feed compose + interactions
- Profile tabs (posts, likes, activity, followers, following)

## Testing

- Backend: Jest setup + coverage scripts
- Mobile: Jest tests (currently utility-focused)

Common commands:

```bash
cd backend && npm test
cd backend && npm run test:cov
cd mobile && npm test
```

## Known Gaps / Tech Debt

- Passwords are currently plaintext (must be hashed).
- JWT secret is currently logged during auth module init.
- DB credentials are currently hardcoded in backend config.
- Token storage is acceptable for web, weaker for native device security.

## Status

This is a solid social-graph + activity-feed MVP.

Current phase is active development, not production hardening.

If the next milestone is ship-ready, prioritize:

1. Security hardening
2. Env/config cleanup
3. Auth/state unification
