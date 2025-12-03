// __tests__/utils/validateUserName.test.ts
import { validateUserName } from '../utils/validateUserName';

describe("validateUserName", () => {
  test("valid names", () => {
    expect(validateUserName("Alice")).toBe(true);
    expect(validateUserName("Bob123")).toBe(true);
  });

  test("invalid names", () => {
    expect(validateUserName("123Bob")).toBe(false);
    expect(validateUserName("_Alice")).toBe(false);
    expect(validateUserName("Alice!")).toBe(false);
  });
});
