import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "@/styles";
import { login } from "@/graphql/client";
import { Language } from "@/hooks/i18n.translations";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { AppLogo } from "@/components/common/AppLogo";
import { PageShell } from "@/components/layout/PageShell";
import { authFormStyles as styles } from "@/styles";
import {
  LOGIN_IDENTIFIER_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/config/inputLimits";

const LANGUAGE_OPTIONS: Language[] = ["en", "tr", "de"];
const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
};
const LOGIN_SEEN_KEY = "login_seen_before";

function canUseLocalStorage(): boolean {
  return typeof globalThis !== "undefined" && "localStorage" in globalThis;
}

async function getLoginSeenBefore(): Promise<boolean> {
  try {
    if (canUseLocalStorage()) {
      return globalThis.localStorage.getItem(LOGIN_SEEN_KEY) === "true";
    }

    return (await SecureStore.getItemAsync(LOGIN_SEEN_KEY)) === "true";
  } catch {
    return false;
  }
}

async function setLoginSeenBefore(): Promise<void> {
  try {
    if (canUseLocalStorage()) {
      globalThis.localStorage.setItem(LOGIN_SEEN_KEY, "true");
      return;
    }

    await SecureStore.setItemAsync(LOGIN_SEEN_KEY, "true");
  } catch {
    // ignore
  }
}

export default function Login() {
  const { setSession } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [seenBefore, setSeenBefore] = useState<boolean | null>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const passwordDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const seen = await getLoginSeenBefore();
      if (!active) return;

      setSeenBefore(seen);
      if (!seen) {
        void setLoginSeenBefore();
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      if (passwordDebounceRef.current) clearTimeout(passwordDebounceRef.current);
      return;
    }

    if (passwordDebounceRef.current) clearTimeout(passwordDebounceRef.current);

    passwordDebounceRef.current = setTimeout(() => {
      if (password.length < PASSWORD_MIN_LENGTH) {
        setPasswordError(t("auth.login.error.passwordLength"));
      } else if (password.length > PASSWORD_MAX_LENGTH) {
        setPasswordError(t("auth.login.error.passwordMax"));
      } else {
        setPasswordError(null);
      }
    }, 300);
  }, [password, t]);

  const handleLanguageSelect = async (option: Language) => {
    await setLanguage(option);
    setLanguageMenuOpen(false);
  };

  const handleLogin = async () => {
    setError("");
    setIdentifierError(null);
    setPasswordError(null);

    const trimmedIdentifier = identifier.trim();

    const nextIdentifierError = trimmedIdentifier
      ? null
      : t("auth.login.error.identifierRequired");
    const nextPasswordError = !password
      ? t("auth.login.error.passwordRequired")
      : password.length < PASSWORD_MIN_LENGTH
        ? t("auth.login.error.passwordLength")
        : password.length > PASSWORD_MAX_LENGTH
          ? t("auth.login.error.passwordMax")
          : null;

    const validationMessages = [nextIdentifierError, nextPasswordError].filter(
      (message): message is string => Boolean(message),
    );

    if (validationMessages.length > 0) {
      setIdentifierError(nextIdentifierError);
      setPasswordError(nextPasswordError);
      setError(Array.from(new Set(validationMessages)).join("\n"));
      return;
    }

    setLoading(true);

    try {
      const authPayload = await login(trimmedIdentifier, password);

      await setSession({
        token: authPayload.token,
        refreshToken: authPayload.refreshToken,
        user: authPayload.user,
        emailVerified: authPayload.emailVerified,
      });

      if (authPayload.emailVerified) {
        router.replace("/(app)/feed");
      } else {
        router.replace("/(auth)/verify-mail");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.login.error.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell header={<View />} contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
      <View style={[commonStyles.container, commonStyles.center]}>
        <AppLogo subtitle={seenBefore === false ? t("auth.login.subtitleFirstTime") : t("auth.login.subtitle")} />
        <View style={styles.titleRow}>
          <Text style={[commonStyles.title, styles.titleNoBottomMargin]}>{t("auth.login.title")}</Text>

          <View style={styles.titleLanguageMenuWrap}>
            <Pressable
              onPress={() => setLanguageMenuOpen((prev) => !prev)}
              style={styles.titleLanguageIconButton}
            >
              <Ionicons name="globe-outline" size={18} color="#1d4ed8" />
            </Pressable>

            {languageMenuOpen && (
              <View style={styles.titleLanguageDropdown}>
                {LANGUAGE_OPTIONS.map((option) => {
                  const active = language === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => void handleLanguageSelect(option)}
                      style={[styles.titleLanguageDropdownItem, active && styles.titleLanguageDropdownItemActive]}
                    >
                      <Text style={[styles.titleLanguageDropdownItemText, active && styles.titleLanguageDropdownItemTextActive]}>
                        {LANGUAGE_NAMES[option]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.formWrap}>
          <TextInput
            placeholder={t("auth.login.identifierPlaceholder")}
            placeholderTextColor="#d1d5db"
            value={identifier}
            onChangeText={(value) => {
              setIdentifier(value);
              if (error) setError("");
            }}
            autoCapitalize="none"
            maxLength={LOGIN_IDENTIFIER_MAX_LENGTH}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            style={commonStyles.input}
          />
          {identifierError ? <Text style={styles.inlineErrorText}>{identifierError}</Text> : null}

          <TextInput
            ref={passwordInputRef}
            placeholder={t("auth.login.passwordPlaceholder")}
            placeholderTextColor="#d1d5db"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (error) setError("");
            }}
            secureTextEntry
            maxLength={PASSWORD_MAX_LENGTH}
            returnKeyType="go"
            onSubmitEditing={() => void handleLogin()}
            style={[commonStyles.input, styles.inputTopGap]}
          />
          {passwordError ? <Text style={styles.inlineErrorText}>{passwordError}</Text> : null}

          <View style={styles.actionsCenter}>
            <Pressable
              style={[commonStyles.button, styles.submitButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={commonStyles.buttonText}>
                {loading ? t("auth.login.submitting") : t("auth.login.submit")}
              </Text>
            </Pressable>
          </View>

          {error ? (
            <Text style={styles.errorText}>
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={() => router.push("/(auth)/signUp")}
            style={styles.navLinkWrap}
          >
            <Text style={styles.navLinkText}>{t("auth.login.signUpLink")}</Text>
          </Pressable>
        </View>
      </View>
    </PageShell>
  );
}
