import { clearToken, getEmailVerified, getToken, saveEmailVerified, saveToken } from "../utils/token";

describe("token utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saveToken writes auth token", async () => {
    await saveToken("abc123");

    expect(localStorage.setItem).toHaveBeenCalledWith("auth_token", "abc123");
  });

  it("getToken reads auth token", async () => {
    (localStorage.getItem as jest.Mock).mockReturnValueOnce("abc123");

    await expect(getToken()).resolves.toBe("abc123");
    expect(localStorage.getItem).toHaveBeenCalledWith("auth_token");
  });

  it("clearToken removes auth token", async () => {
    await clearToken();

    expect(localStorage.removeItem).toHaveBeenCalledWith("auth_token");
    expect(localStorage.removeItem).toHaveBeenCalledWith("auth_email_verified");
  });

  it("saveEmailVerified writes encoded value", async () => {
    await saveEmailVerified(true);
    await saveEmailVerified(false);

    expect(localStorage.setItem).toHaveBeenCalledWith("auth_email_verified", "true");
    expect(localStorage.setItem).toHaveBeenCalledWith("auth_email_verified", "false");
  });

  it("getEmailVerified decodes true/false values", async () => {
    (localStorage.getItem as jest.Mock)
      .mockReturnValueOnce("true")
      .mockReturnValueOnce("false")
      .mockReturnValueOnce(null);

    await expect(getEmailVerified()).resolves.toBe(true);
    await expect(getEmailVerified()).resolves.toBe(false);
    await expect(getEmailVerified()).resolves.toBeNull();
  });

  it("saveEmailVerified swallows storage errors", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("storage failed");
    });

    await expect(saveEmailVerified(true)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("getEmailVerified returns null on storage errors", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (localStorage.getItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("storage failed");
    });

    await expect(getEmailVerified()).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("saveToken swallows storage errors", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("storage failed");
    });

    await expect(saveToken("abc123")).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("getToken returns null on storage errors", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    (localStorage.getItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("storage failed");
    });

    await expect(getToken()).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("clearToken swallows storage errors", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    (localStorage.removeItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("storage failed");
    });

    await expect(clearToken()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
