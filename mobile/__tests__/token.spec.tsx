import { clearToken, getToken, saveToken } from "../utils/token";

describe("token utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saveToken writes auth token", () => {
    saveToken("abc123");

    expect(localStorage.setItem).toHaveBeenCalledWith("auth_token", "abc123");
  });

  it("getToken reads auth token", () => {
    (localStorage.getItem as jest.Mock).mockReturnValueOnce("abc123");

    expect(getToken()).toBe("abc123");
    expect(localStorage.getItem).toHaveBeenCalledWith("auth_token");
  });

  it("clearToken removes auth token", () => {
    clearToken();

    expect(localStorage.removeItem).toHaveBeenCalledWith("auth_token");
  });

  it("saveToken swallows storage errors", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("storage failed");
    });

    expect(() => saveToken("abc123")).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("getToken returns null on storage errors", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (localStorage.getItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("storage failed");
    });

    expect(getToken()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("clearToken swallows storage errors", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    (localStorage.removeItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("storage failed");
    });

    expect(() => clearToken()).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
