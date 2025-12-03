// utils/__tests__/mapResultToCards.spec.ts
import { mapResultToCards, Result, Card } from "../utils/mapResultToCards";

describe("mapResultToCards", () => {
  it("should return an empty array for 'idle' result", () => {
    const result: Result = { type: "idle" };
    expect(mapResultToCards(result)).toEqual([]);
  });

  it("should return an empty array for 'error' result", () => {
    const result: Result = { type: "error", message: "Something went wrong" };
    expect(mapResultToCards(result)).toEqual([]);
  });

  it("should map 'addedUser' to a green card", () => {
    const result: Result = {
      type: "addedUser",
      user: { id: 1, name: "Alice" },
    };
    expect(mapResultToCards(result)).toEqual([
      { id: 1, name: "Alice", hue: "green" },
    ]);
  });

  it("should map 'getUsers' with correct hues", () => {
    const result: Result = {
      type: "getUsers",
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "User not found" },
      ],
    };

    expect(mapResultToCards(result)).toEqual([
      { id: 1, name: "Alice", hue: "#f0f0f0" },
      { id: 2, name: "User not found", hue: "red" },
    ]);
  });

  it("should map 'deletedUsers' with correct hues", () => {
    const result: Result = {
      type: "deletedUsers",
      users: [
        { id: 1, name: "Deleted Bob" },
        { id: 2, name: "User not found" },
        { id: 3, name: "Charlie" },
      ],
    };

    expect(mapResultToCards(result)).toEqual([
      { id: 1, name: "Deleted Bob", hue: "orange" },
      { id: 2, name: "User not found", hue: "red" },
      { id: 3, name: "Charlie", hue: "#f0f0f0" },
    ]);
  });
});
