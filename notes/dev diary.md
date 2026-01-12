“Resolver Test → Architecture Cleanup”

Date: 2025-11-27
Topic: Resolver error-handling & the “god function” refactor

1. What I Tried

I started with something simple:
writing a resolver unit test.

The positive test passed.

The negative test (error scenario) failed, but not for the reason I expected.

The resolver was throwing a different error than what I had in my test case.

2. What I Found (Root Cause Discovery)

I dug into it and realized several things:

Resolvers were making raw direct DB calls.
→ That means inconsistent behavior + duplicated logic.

Some resolver methods didn’t have try/catch.
→ They leaked internal errors instead of throwing the API-safe NestJS exceptions.

findUser(idOrName) in the service
looked clever but turned out to be a design trap:

boolean logic based on type (“number = id, string = name”)

slightly different behavior paths

hardcoded assumptions

no flexibility for future changes

ambiguous responsibility (overloaded function)

a silent “god function” smell

Unit tests exposed the fact that resolver error behavior
depended on internal quirks of findUser().

This is very subtle technical debt — the exact kind that unit tests reveal early.

3. Moment of Insight

I realized:

If I leave findUser(idOrName) as-is
and just patch it with more conditions,
I’ll be building architecture rot on top of architecture rot.

I considered a “safe” enterprise pattern:

Add findUserById and findUserByName

Keep old findUser as a wrapper to avoid breaking callers

Deprecate old one later

But then I also realized:

I’m early in the project

The only caller is this resolver

I can safely break it right now

A wrapper adds indirection + future confusion

Overloaded functions with secret branching logic become silent bombs

So instead, I did the clean thing:

4. The Decision

Delete the ambiguous findUser(idOrName).

Replace it with:

findUserById(id: number)

findUserByName(name: string)

And remove direct DB calls from resolvers entirely.

This gives:

✔ Clear separation of concerns
✔ No magic branching logic
✔ Actual service-level abstraction
✔ Predictable error behavior
✔ Tests that reflect real contract
✔ No future “enterprise-style hacks” to work around god functions

And most importantly:

✔ Avoids the exact architectural rot I’ve been studying.

5. Why I Chose to Do It Now

Because this is still a small codebase.

If this were a real company:

findUser(idOrName) might be called from 40+ places.

Rewriting it would require a multi-team refactor.

People would hack around it instead.

The function would rot and grow even more logic.

Eventually it becomes a “blast radius” feature that nobody wants to touch.

Right now, I have the luxury to keep the codebase clean.

So I took it.

6. Outcome

Resolver tests are predictable

Error scenarios behave consistently

Future features won’t rely on hidden branching logic

Service layer is now explicit instead of magical

Code readability drastically improved

This was a small test issue that turned into a very meaningful architectural cleanup.




"Unit test mock func type args tuple - the Y"

2025/11/30

3️⃣ Advantages of keeping it
findOne: jest.Mock<Promise<T | null>, [any]>;


Helps TypeScript check that you call the mock with the correct arguments.

If you do repo.findOne('wrong type'), TS will warn.

Useful for catching mistakes in larger test suites.


Date 12.01.2026

Question

When exposing posts over GraphQL, should the API return only a user_id and let the client fetch user data separately, or should the post directly expose its associated user object?

Problem

At the database level, posts reference users via a foreign key (user_id). However, exposing only this identifier at the API layer shifts responsibility to the client to resolve related user data. This forces clients to coordinate multiple requests, introduces unnecessary coupling between client logic and backend structure, and treats persistence details as part of the public API contract.

Additionally, frontend requirements (e.g., displaying username, profile picture, or verification status) naturally require user data alongside posts, making separate fetches both repetitive and error-prone.

Decision

Posts should expose their associated user directly in the GraphQL schema rather than exposing only user_id.

GraphQL APIs are designed to model domain relationships, not database foreign keys. By exposing user, the backend remains responsible for composing related data, and clients can declaratively request exactly the author information they need in a single query. This results in a cleaner API contract, better separation of concerns, and improved flexibility as user-related fields evolve over time.

Foreign keys remain an internal database concern and are intentionally not reflected directly in the public GraphQL schema.