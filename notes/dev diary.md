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
