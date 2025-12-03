// __tests__/utils/parseQuery.test.ts
import { parseQuery } from '../utils/parseQuery';

describe("parseQuery", () => {
  test("parses numeric IDs only", () => {
    expect(parseQuery("1,2,3")).toEqual({ ids: [1,2,3], names: [] });
  });

  test("parses names only", () => {
    expect(parseQuery("Alice,Bob")).toEqual({ ids: [], names: ["Alice","Bob"] });
  });

  test("parses mixed IDs and names", () => {
    expect(parseQuery("1, two ,3")).toEqual({ ids: [1,3], names: ["two"] });
  });

  test("trims spaces and ignores empty entries", () => {
    expect(parseQuery(" , 5 , , John  , ")).toEqual({ ids: [5], names: ["John"] });
  });
});
