import { getCurrentUser } from "../utils/currentUser";
import { graphqlFetch } from "../utils/graphqlFetch";
import { ME_QUERY } from "../graphql/operations";

jest.mock("../utils/graphqlFetch", () => ({
  graphqlFetch: jest.fn(),
}));

describe("getCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns me when query succeeds", async () => {
    const me = { id: 1, username: "deniz", displayName: "Deniz" };
    (graphqlFetch as jest.Mock).mockResolvedValueOnce({ me });

    await expect(getCurrentUser()).resolves.toEqual(me);
    expect(graphqlFetch).toHaveBeenCalledWith(ME_QUERY);
  });

  it("returns null for auth failures", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"));

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("rethrows transient failures", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (graphqlFetch as jest.Mock).mockRejectedValueOnce(new Error("network failed"));

    await expect(getCurrentUser()).rejects.toThrow("network failed");
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
