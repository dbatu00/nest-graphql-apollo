# Testing Playbook (Low Brain Power Edition)

This is your fastest path to useful tests in this repo.

## 1) What counts as a good unit test here

A unit test in this stack should:

- test one function/screen/hook behavior at a time
- isolate external I/O (network, DB, storage) with mocks
- assert outcomes, not implementation internals
- follow **Arrange → Act → Assert**

If a test forces you to start real DB/server/UI navigation stacks, it is not unit-level anymore.

---

## 2) One-command test workflow from repo root

```bash
npm run test
npm run test:backend
npm run test:mobile
npm run test:cov
```

Use this default cadence while shipping:

1. while coding: `npm run test:backend` or `npm run test:mobile`
2. before merge: `npm run test`
3. before release: `npm run test:cov`

---

## 3) Backend low-effort pattern (Nest + TypeORM)

### Reusable helpers

- Repository mocks: `backend/src/test-utils/typeorm.mocks.ts`
- Example env unit tests: `backend/src/config/environment.spec.ts`

### Service test template (copy/paste)

```ts
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { createRepositoryMock } from 'src/test-utils/typeorm.mocks';
import { User } from '../user.entity';
import { Follow } from 'src/follows/follow.entity';

describe('UsersService', () => {
  const userRepo = createRepositoryMock<User>();
  const followRepo = createRepositoryMock<Follow>();
  const service = new UsersService(userRepo as any, followRepo as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when user does not exist', async () => {
    userRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.updateMyProfile(1, { displayName: 'x' }))
      .rejects
      .toBeInstanceOf(NotFoundException);
  });
});
```

Backend quick target list:

- `validateEnvironment` edge cases (pure function, very fast)
- service branches (not-found, forbidden, bad input)
- resolver argument validation behavior

---

## 4) Mobile low-effort pattern (Expo + RTL)

### Reusable helpers

- Fetch + casting helpers: `mobile/test-utils/jest.ts`
- Good network-layer reference: `mobile/__tests__/graphqlFetch.spec.tsx`

### Hook/screen template (copy/paste)

```tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Screen from '../app/(auth)/login';
import { graphqlFetch } from '../utils/graphqlFetch';
import { asMock } from '../test-utils/jest';

jest.mock('../utils/graphqlFetch', () => ({ graphqlFetch: jest.fn() }));

describe('ScreenName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows API error message', async () => {
    asMock(graphqlFetch).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { getByText } = render(<Screen />);
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
  });
});
```

Mobile quick target list:

- auth route redirects
- submit success/failure states
- optimistic update rollback on mutation failure

---

## 5) Minimal quality bar (so tests don’t rot)

Keep each test to one reason to fail.

Checklist:

- clear test name: `it('returns X when Y')`
- exactly one behavior branch per test
- avoid giant fixtures; start minimal and override only what matters
- reset mocks in `beforeEach`
- avoid snapshot-first testing for logic-heavy flows

---

## 6) If your brain is fried: 5-minute recipe

1. Pick one branch (`success` or `error`).
2. Mock one dependency (`graphqlFetch`, repository, token, etc.).
3. Trigger one action.
4. Assert one visible outcome.
5. Stop. Repeat for next branch.

That is enough to ship confidence quickly.
