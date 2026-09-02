import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const LEGACY_EMAIL_VERIFIED_KEY = "auth_email_verified";

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

export async function saveRefreshToken(token: string): Promise<void> {
  try {
    if (canUseLocalStorage()) {
      globalThis.localStorage.setItem(REFRESH_TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (err: unknown) {
    console.error("[token] save refresh failed", err);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (canUseLocalStorage()) {
      return globalThis.localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (err: unknown) {
    console.warn("[token] read refresh failed", err);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (canUseLocalStorage()) {
      globalThis.localStorage.removeItem(TOKEN_KEY);
      globalThis.localStorage.removeItem(REFRESH_TOKEN_KEY);
      globalThis.localStorage.removeItem(LEGACY_EMAIL_VERIFIED_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(LEGACY_EMAIL_VERIFIED_KEY);
  } catch (err: unknown) {
    console.error("[token] clear failed", err);
  }
}
