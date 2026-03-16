# Notes

## Nullable field semantics

```ts
@Column({ nullable: true }) // TypeORM: DB allows NULL
@Field(() => String, { nullable: true }) // GraphQL: API allows null
nickname?: string | null; // TypeScript: optional property and can be null
```

## Why not allow variable types at field level?

- Single type check per operation at the operation entry point.
- Field-level typing would add recursive validation complexity.
- Variables can be reused across multiple fields.
- Operation signatures provide a cleaner client contract.

Example:

```graphql
query ($id: Int!) {
  getUser(id: $id) {
    id
    name
  }
  getPosts(authorId: $id) {
    title
  }
}
```

## Why both `user.entity` and `DeleteUserOutput`?

- Entities are DB-centric and may include internal/sensitive fields.
- DTO/output types are API-centric and intentionally scoped.
- Different operations can return different shapes.
- This avoids coupling public API contracts directly to DB schema.


## React useEffect: Cleanup & State Update on Unmounted

t0 component mounts
t1 fetch request starts
t2 user navigates away
t3 component unmounts
t4 fetch finishes
t5 setState() runs
=> memory leak

References:
- https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
- https://overreacted.io/a-complete-guide-to-useeffect/#so-what-about-cleanup
