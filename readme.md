# Nest GraphQL Apollo — Social Feed Monorepo

Full-stack social feed MVP built in a monorepo.

- Backend: NestJS + Apollo GraphQL + TypeORM + PostgreSQL
- Mobile: Expo React Native + Expo Router

Core domain: auth, profiles, posts, likes, follows, and an activity feed.

## Monorepo layout

```text
backend/   NestJS GraphQL API
mobile/    Expo app
notes/     working notes and roadmap
```

## Documentation map

- Root overview: [./readme.md](./readme.md)
- Backend docs: [./backend/README.md](./backend/README.md)
- Mobile docs: [./mobile/README.md](./mobile/README.md)
- Notes:
  - [./notes/todo.md](./notes/todo.md)
  - [./notes/notes.md](./notes/notes.md)
  - [./notes/dev diary.md](./notes/dev%20diary.md)

## Quick start

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL

### Install

From repository root:

```bash
npm install
cd backend && npm install
cd ../mobile && npm install
```

### Environment

Backend minimum:

- `JWT_SECRET`

Mobile minimum:

- `EXPO_PUBLIC_API_URL` (for local: `http://localhost:3000/graphql`)

### Run both apps

From root:

```bash
npm run dev
```

## Root scripts

- `npm run dev` — backend + mobile concurrently
- `npm run dev:backend` — backend watch mode
- `npm run dev:mobile` — Expo dev server

## Current architecture highlights

- Mobile GraphQL operations are wrapped in typed client functions.
- Backend resolvers use validated args DTOs.
- Shared string validation decorators centralize trim/non-blank behavior.
- Resolver + service test coverage is in place across core modules.

## Testing

```bash
cd backend && npm test
cd backend && npm run test:cov
cd mobile && npm test
```

## Current focus

- Continue production hardening (migrations, secrets, deployment profile tuning)
- Improve UX polish + integration-level tests
- Keep GraphQL contracts lean and typed end-to-end
