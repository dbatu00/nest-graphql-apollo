# Mobile App (Expo Router)

React Native client for the social feed app.

- Framework: Expo + React Native + Expo Router
- Data layer: GraphQL via `graphqlFetch`
- State style: hook-driven (`useActivities`, `useProfile`, `useAuth`)

## Quick Start (Monorepo)

From repository root:

```bash
npm install
npm run dev
```

This starts backend + mobile together. See [../readme.md](../readme.md) for full monorepo setup.

## Features

- Auth screens: login + sign-up
- Feed screen: compose, like/unlike, follow/unfollow, delete own posts
- Profile screen by username with tabs:
   - posts
   - likes
   - activity
   - followers
   - following
- Optimistic updates in activity feed actions with fallback refresh on errors

## Routing

```text
app/
   (auth)/
      login.tsx
      signUp.tsx
   (app)/
      feed.tsx
      profile/[username].tsx
```

## Local Setup

### Prerequisites

- Node.js 18+
- Expo tooling (installed via npm scripts)
- Backend API running locally

### Install

```bash
npm install
```

### Environment

Required:

- `EXPO_PUBLIC_API_URL` (GraphQL endpoint)

Example:

```text
http://localhost:3000/graphql
```

### Run

```bash
npm run start
```

Platform shortcuts:

```bash
npm run android
npm run ios
npm run web
```

## Scripts

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm run test`

## App Architecture Notes

- Navigation is file-based with Expo Router route groups.
- Client GraphQL calls are centralized in `utils/graphqlFetch.tsx`.
- Token is attached as bearer auth when present and stored via secure platform storage on native (`expo-secure-store`) with web `localStorage` fallback.
- Current-user identity is fetched using the `me` query helper.

## Current Caveats

- Root-level `useAuth` includes simulated behavior and is not yet a hardened production auth source of truth.
- Some UI styles are still inline/hardcoded and not fully centralized.

## Suggested Next Steps

1. Unify auth state flow across hooks/routes.
2. Expand tests beyond utility-level behavior into flow-level coverage.
