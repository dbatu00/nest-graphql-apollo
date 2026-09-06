import * as SecureStore from "expo-secure-store";
import { Language } from "@/hooks/i18n.translations";

const LANGUAGE_KEY = "app_language";

function canUseLocalStorage(): boolean {
  return typeof globalThis !== "undefined" && "localStorage" in globalThis;
}

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "tr" || value === "de";
}

export async function getStoredAppLanguage(): Promise<Language | null> {
  try {
    const value = canUseLocalStorage()
      ? globalThis.localStorage.getItem(LANGUAGE_KEY)
      : await SecureStore.getItemAsync(LANGUAGE_KEY);

    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}