import { logout } from "../utils/logout";
import { clearToken } from "../utils/token";
import { router } from "expo-router";

jest.mock("../utils/token", () => ({
  clearToken: jest.fn(),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

describe("logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears token and redirects to login", async () => {
    await logout();

    expect(clearToken).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("still redirects when token clear throws", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    (clearToken as jest.Mock).mockRejectedValueOnce(new Error("clear failed"));

    await expect(logout()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/login");

    errorSpy.mockRestore();
  });
});
