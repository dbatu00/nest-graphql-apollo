import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Language, TranslationKey, translations } from "@/hooks/i18n.translations";

const LANGUAGE_KEY = "app_language";

type I18nContextValue = {
    language: Language;
    setLanguage: (language: Language) => Promise<void>;
    t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function canUseLocalStorage(): boolean {
    return typeof globalThis !== "undefined" && "localStorage" in globalThis;
}

function isLanguage(value: string | null): value is Language {
    return value === "en" || value === "tr" || value === "de";
}

async function saveLanguage(value: Language): Promise<void> {
    try {
        if (canUseLocalStorage()) {
            globalThis.localStorage.setItem(LANGUAGE_KEY, value);
            return;
        }

        await SecureStore.setItemAsync(LANGUAGE_KEY, value);
    } catch (err: unknown) {
        console.warn("[i18n] language save failed", err);
    }
}

async function getStoredLanguage(): Promise<Language | null> {
    try {
        const value = canUseLocalStorage()
            ? globalThis.localStorage.getItem(LANGUAGE_KEY)
            : await SecureStore.getItemAsync(LANGUAGE_KEY);

        return isLanguage(value) ? value : null;
    } catch (err: unknown) {
        console.warn("[i18n] language read failed", err);
        return null;
    }
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");

    useEffect(() => {
        const load = async () => {
            const stored = await getStoredLanguage();
            if (stored) {
                setLanguageState(stored);
            }
        };

        void load();
    }, []);

    const setLanguage = useCallback(async (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        await saveLanguage(nextLanguage);
    }, []);

    const t = useCallback((key: TranslationKey) => {
        const selectedLanguagePack = translations[language] as Partial<Record<TranslationKey, string>>;
        return selectedLanguagePack[key] ?? translations.en[key] ?? key;
    }, [language]);

    const value = useMemo(() => ({
        language,
        setLanguage,
        t,
    }), [language, setLanguage, t]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error("useI18n must be used inside I18nProvider");
    }

    return context;
}