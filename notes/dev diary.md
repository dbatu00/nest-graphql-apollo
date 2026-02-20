# Dev Diary

## 2025-11-27 — Resolver Test → Architecture Cleanup

**Topic:** Resolver error handling and the “god function” refactor.

### 1) What I tried

I started with a resolver unit test.

- Positive scenario passed.
- Negative scenario failed for an unexpected reason.
- Resolver threw a different error than the test expected.

### 2) What I found (root cause)

- Resolvers made raw direct DB calls (inconsistent behavior, duplicated logic).
- Some resolver methods lacked `try/catch` and leaked internal errors.
- `findUser(idOrName)` in the service was a design trap:
	- type-based branching (`number => id`, `string => name`)
	- divergent behavior paths
	- hardcoded assumptions
	- limited extensibility
	- ambiguous responsibility

Unit tests exposed that resolver error behavior depended on internal quirks of `findUser()`.

### 3) Insight

Patching `findUser(idOrName)` with more conditions would compound technical debt.

I considered a transitional pattern:

- Add `findUserById` and `findUserByName`
- Keep old `findUser` as wrapper
- Deprecate later

But this project is still early, and the caller surface was small, so I chose the cleaner break now.

### 4) Decision

Removed ambiguous `findUser(idOrName)`.

Replaced with:

- `findUserById(id: number)`
- `findUserByName(name: string)`

Also removed direct DB calls from resolvers.

### 5) Why now

Small codebase = low refactor cost. In a larger org, this kind of change usually becomes expensive and delayed.

### 6) Outcome

- Predictable resolver tests
- Consistent error scenarios
- Explicit service layer
- Better readability
- Less long-term architecture risk

---

## 2025-11-30 — Unit test mock typing

`findOne: jest.Mock<Promise<T | null>, [any]>;`

Advantages:

- TypeScript validates mock argument shape.
- Wrong argument usage gets flagged early.
- Helps avoid mistakes in larger test suites.

---

## 2026-01-12 — GraphQL post author shape

### Question

Should posts return only `user_id`, or expose `user` directly?

### Decision

Expose `user` directly on posts in GraphQL.

### Reasoning

- GraphQL models domain relationships, not DB foreign keys.
- Backend should compose related data.
- Clients can request exactly needed author fields in one query.
- Keeps DB internals out of public API contracts.

---

## 2026-01-14 — `addPost` return type

### Question

Client doesn’t need returned post now. Why not return `Boolean` instead of `Post!`?

### Answer

Returning `Boolean` weakens the API contract. GraphQL mutations should return the resulting domain object when possible.

Returning `Post`:

- preserves flexibility for future clients,
- supports immediate UI updates,
- exposes server-generated fields (`id`, `createdAt`),
- improves composability and error handling.

---

## 2026-02-13 — File cohesion and data model choice

I chose cohesive, larger files over premature splitting. If a file has one clear responsibility, line count alone is not a problem.

I also kept core tables unchanged: `User`, `Auth`, `Post`, `Like`, `Follow`, `Activity`.

- `Like` remains source of truth for interactions.
- `Activity` remains denormalized/indexed read model for feed performance.

This balances performance with correctness and maintainability.

---

## 2026-02-14 — Contract and activity refactor decisions

- Keep using `username` in API contracts for readability.

### Activity refactor decision

Revisited responsibilities between domain modules (`Posts`, `Follows`, `Likes`) and `Activity`.

Options:

1. Make `ActivityService` dumb and push branching into domain services.
2. Keep domain services thin and let `ActivityService` handle limited type branching.

Given fixed scope, no planned new activity types, and no CQRS/event-projection need, I kept the current structure.

`ActivityService` keeps controlled branching; domain services delegate activity updates.

### Follow resolver note

Explicit follow/unfollow remains clearer and safer.

Do not collapse purely for symmetry.

Readability > theoretical DRY in this case.