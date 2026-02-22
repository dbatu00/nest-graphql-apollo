const TOKEN_KEY = "auth_token";

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err: unknown) {
    console.error('[token] save failed', err);
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err: unknown) {
    console.warn('[token] read failed', err);
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err: unknown) {
    console.error('[token] clear failed', err);
  }
}
