// utils/mapResultToCards.ts
export type Result =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "addedUser"; user: { id: number; name: string } }
  | { type: "getUsers"; users: { id: number; name: string }[] }
  | { type: "deletedUsers"; users: { id: number; name: string }[] };

export type Card = { id: number; name: string; hue: string };

export function mapResultToCards(result: Result): Card[] {
  switch (result.type) {
    case "getUsers":
      return result.users.map(u => ({
        ...u,
        hue: u.name === "User not found" ? "red" : "#f0f0f0",
      }));

    case "addedUser":
      return [{ ...result.user, hue: "green" }];

    case "deletedUsers":
      return result.users.map(u => ({
        ...u,
        hue: u.name.startsWith("Deleted")
          ? "orange"
          : u.name === "User not found"
          ? "red"
          : "#f0f0f0",
      }));

    case "error":
    case "idle":
    default:
      return [];
  }
}
