import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const EMAIL_VERIFIED_KEY = "auth_email_verified";

function canUseLocalStorage(): boolean {
  return typeof globalThis !== "undefined" && "localStorage" in globalThis;
}

export async function saveToken(token: string): Promise<void> {
  try {
    if (canUseLocalStorage()) {
      globalThis.localStorage.setItem(TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err: unknown) {
    console.error("[token] save failed", err);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    if (canUseLocalStorage()) {
      return globalThis.localStorage.getItem(TOKEN_KEY);
    }

    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err: unknown) {
    console.warn("[token] read failed", err);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (canUseLocalStorage()) {
      globalThis.localStorage.removeItem(TOKEN_KEY);
      globalThis.localStorage.removeItem(EMAIL_VERIFIED_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(EMAIL_VERIFIED_KEY);
  } catch (err: unknown) {
    console.error("[token] clear failed", err);
  }
}

export async function saveEmailVerified(value: boolean): Promise<void> {
  try {
    const encoded = value ? "true" : "false";

    if (canUseLocalStorage()) {
      globalThis.localStorage.setItem(EMAIL_VERIFIED_KEY, encoded);
      return;
    }

    await SecureStore.setItemAsync(EMAIL_VERIFIED_KEY, encoded);
  } catch (err: unknown) {
    console.error("[token] save emailVerified failed", err);
  }
}

export async function getEmailVerified(): Promise<boolean | null> {
  try {
    const value = canUseLocalStorage()
      ? globalThis.localStorage.getItem(EMAIL_VERIFIED_KEY)
      : await SecureStore.getItemAsync(EMAIL_VERIFIED_KEY);

    if (value === null) {
      return null;
    }

    return value === "true";
  } catch (err: unknown) {
    console.warn("[token] read emailVerified failed", err);
    return null;
  }
}
