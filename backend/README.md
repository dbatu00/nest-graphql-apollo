# Backend API (NestJS + GraphQL)

Backend for the social feed app.

- Framework: NestJS 11
- API: Apollo GraphQL (code-first)
- ORM: TypeORM 0.3
- DB: PostgreSQL
- Auth: JWT + Passport + GraphQL guard

## Quick Start (Monorepo)

From repository root:

```bash
npm install
npm run dev
```

This starts backend + mobile together. See [../readme.md](../readme.md) for full monorepo setup.

## Features

- Authentication: `signUp`, `login`, `me`
- Profiles/users: `userByUsername`, follower/following counts, follow state
- Posts: create, read, delete, like/unlike, liked posts
- Follows: follow/unfollow + relationship queries
- Activity feed: mixed events (`post`, `follow`, `like`, `share`) with filters

## Project Structure

```text
src/
  auth/
  users/
  posts/
  follows/
  activity/
  app.module.ts
  main.ts
  schema.gql (auto-generated)
```

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### Install

```bash
npm install
```

### Environment

Required:

- `JWT_SECRET`

Optional:

- `PORT` (defaults to `3000`)

### Run

```bash
# dev watch mode
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

GraphQL endpoint:

```text
http://localhost:3000/graphql
```

## Scripts

- `npm run start`
- `npm run start:dev`
- `npm run start:debug`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:watch`
- `npm run test:cov`
- `npm run test:e2e`

## Data Model (High-Level)

- `User`
- `Auth`
- `Post`
- `Like` (unique user/post, soft-like via `active`)
- `Follow` (unique follower/following)
- `Activity` (denormalized feed events with `active`)

## Behavior Notes

- Like/unlike and follow/unfollow are designed to be idempotent.
- Activity entries are updated as part of write flows.
- Feed excludes inactive like/follow activity records.
- CORS is enabled globally.

## Current Caveats (Dev Mode)

- Passwords are currently compared/stored as plain text.
- JWT secret is currently logged during module init.
- Database connection settings are currently hardcoded in `app.module.ts`.
- `synchronize: true` is enabled (good for local iteration, unsafe for production).

## Next Hardening Priorities

1. Add password hashing (bcrypt/argon2).
2. Remove secret logging.
3. Move DB config to environment variables + validation.
4. Replace `synchronize: true` with migrations for production.
