import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

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
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err: unknown) {
    console.error("[token] clear failed", err);
  }
}
