import { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "@/styles";
import { signUp, isUsernameAvailable, isEmailUsed } from "@/graphql/client";
import { Language } from "@/hooks/i18n.translations";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { AppLogo } from "@/components/common/AppLogo";
import { PageShell } from "@/components/layout/PageShell";
import { authFormStyles as styles } from "@/styles";
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from "@/config/inputLimits";

const LANGUAGE_OPTIONS: Language[] = ["en", "tr", "de"];
const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
};

export default function SignUp() {
  const { setSession } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const usernameDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const emailDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const passwordDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const confirmPasswordDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!username.trim()) {
      setUsernameError(null);
      setUsernameChecking(false);
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
      return;
    }

    // Standard validation first
    if (username.trim().length < 3) {
      setUsernameError(t("auth.signup.error.usernameMin"));
      setUsernameChecking(false);
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
      return;
    }

    if (username.trim().length > USERNAME_MAX_LENGTH) {
      setUsernameError(t("auth.signup.error.usernameMax"));
      setUsernameChecking(false);
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
      return;
    }

    setUsernameChecking(true);
    if (error) setError("");

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);

    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(username);
        if (available) {
          setUsernameError(null);
        } else {
          setUsernameError(t("auth.signup.error.usernameUsed"));
        }
      } catch {
        // Silently handle check errors
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
  }, [username, t]);

  useEffect(() => {
    if (!email.trim()) {
      setEmailError(null);
      setEmailChecking(false);
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
      return;
    }

    // Standard validation first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError(t("auth.signup.error.invalidEmail"));
      setEmailChecking(false);
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
      return;
    }

    setEmailChecking(true);
    if (error) setError("");

    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);

    emailDebounceRef.current = setTimeout(async () => {
      try {
        const used = await isEmailUsed(email);
        if (used) {
          setEmailError(t("auth.signup.error.emailUsed"));
        } else {
          setEmailError(null);
        }
      } catch {
        // Silently handle check errors
      } finally {
        setEmailChecking(false);
      }
    }, 500);
  }, [email, t]);

  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      if (passwordDebounceRef.current) clearTimeout(passwordDebounceRef.current);
      return;
    }

    if (passwordDebounceRef.current) clearTimeout(passwordDebounceRef.current);

    passwordDebounceRef.current = setTimeout(() => {
      if (password.length < PASSWORD_MIN_LENGTH) {
        setPasswordError(t("auth.signup.error.passwordLength"));
      } else if (password.length > PASSWORD_MAX_LENGTH) {
        setPasswordError(t("auth.signup.error.passwordMax"));
      } else {
        setPasswordError(null);
      }
    }, 300);
  }, [password, t]);

  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      if (confirmPasswordDebounceRef.current) clearTimeout(confirmPasswordDebounceRef.current);
      return;
    }

    if (confirmPasswordDebounceRef.current) clearTimeout(confirmPasswordDebounceRef.current);

    confirmPasswordDebounceRef.current = setTimeout(() => {
      if (password !== confirmPassword) {
        setConfirmPasswordError(t("auth.signup.error.passwordsNoMatch"));
      } else {
        setConfirmPasswordError(null);
      }
    }, 300);
  }, [confirmPassword, password, t]);

  const getInputStyle = (value: string, error: string | null, checking: boolean) => {
    if (error) return styles.inputError;
    if (checking) return styles.inputChecking;
    if (value) return styles.inputValid;
    return null;
  };

  const handleLanguageSelect = async (option: Language) => {
    await setLanguage(option);
    setLanguageMenuOpen(false);
  };

  const handleSignUp = async () => {
    setError("");
    setUsernameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    const trimmedUsername = username.trim();
    const trimmedLowerCaseEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const nextUsernameError = trimmedUsername ? null : t("auth.signup.error.required");
    const nextEmailError = !trimmedLowerCaseEmail
      ? t("auth.signup.error.required")
      : !emailRegex.test(trimmedLowerCaseEmail)
        ? t("auth.signup.error.invalidEmail")
        : null;
    const nextPasswordError = !password
      ? t("auth.signup.error.required")
      : password.length < PASSWORD_MIN_LENGTH
        ? t("auth.signup.error.passwordLength")
        : password.length > PASSWORD_MAX_LENGTH
          ? t("auth.signup.error.passwordMax")
          : null;
    const nextConfirmPasswordError = !confirmPassword
      ? t("auth.signup.error.required")
      : password !== confirmPassword
        ? t("auth.signup.error.passwordsNoMatch")
        : null;

    const validationMessages = [
      nextUsernameError,
      nextEmailError,
      nextPasswordError,
      nextConfirmPasswordError,
    ].filter((message): message is string => Boolean(message));

    if (validationMessages.length > 0) {
      setUsernameError(nextUsernameError);
      setEmailError(nextEmailError);
      setPasswordError(nextPasswordError);
      setConfirmPasswordError(nextConfirmPasswordError);
      setError(Array.from(new Set(validationMessages)).join("\n"));
      return;
    }

    setLoading(true);

    try {
      const authPayload = await signUp(trimmedUsername, trimmedLowerCaseEmail, password);

      await setSession({
        token: authPayload.token,
        refreshToken: authPayload.refreshToken,
        user: authPayload.user,
        emailVerified: authPayload.emailVerified,
      });

      setSuccess(true);

      setTimeout(() => {
        router.replace(authPayload.emailVerified ? "/(app)/feed" : "/(auth)/verify-mail");
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.signup.error.failed");
      const hasUsernameError = msg.toLowerCase().includes("username");
      const hasEmailError = msg.toLowerCase().includes("email");

      if (hasUsernameError) setUsernameError(msg);
      if (hasEmailError) setEmailError(msg);
      if (!hasUsernameError && !hasEmailError) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell header={<View />} contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
      <View style={[commonStyles.container, commonStyles.center]}>
        <AppLogo subtitle={t("auth.signup.subtitle")} />
        <View style={styles.titleRow}>
          <Text style={[commonStyles.title, styles.titleNoBottomMargin]}>{t("auth.signup.title")}</Text>

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
            placeholder={t("auth.signup.usernamePlaceholder")}
            placeholderTextColor="#d1d5db"
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              if (error) setError("");
            }}
            autoCapitalize="none"
            maxLength={USERNAME_MAX_LENGTH}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            style={[commonStyles.input, getInputStyle(username, usernameError, usernameChecking)]}
          />
          {usernameError ? (
            <Text style={styles.inlineErrorText}>{usernameError}</Text>
          ) : null}

          <TextInput
            ref={emailInputRef}
            placeholder={t("auth.signup.emailPlaceholder")}
            placeholderTextColor="#d1d5db"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) setError("");
            }}
            autoCapitalize="none"
            maxLength={EMAIL_MAX_LENGTH}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            style={[
              commonStyles.input,
              styles.inputTopGap,
              getInputStyle(email, emailError, emailChecking),
            ]}
          />
          {emailError ? (
            <Text style={styles.inlineErrorText}>{emailError}</Text>
          ) : null}

          <TextInput
            ref={passwordInputRef}
            placeholder={t("auth.signup.passwordPlaceholder")}
            placeholderTextColor="#d1d5db"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (error) setError("");
            }}
            secureTextEntry
            maxLength={PASSWORD_MAX_LENGTH}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            style={[
              commonStyles.input,
              styles.inputTopGap,
              passwordError ? styles.inputError : password ? styles.inputValid : null,
            ]}
          />
          {passwordError ? (
            <Text style={styles.inlineErrorText}>{passwordError}</Text>
          ) : null}

          <TextInput
            ref={confirmPasswordInputRef}
            placeholder={t("auth.signup.confirmPasswordPlaceholder")}
            placeholderTextColor="#d1d5db"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (error) setError("");
            }}
            secureTextEntry
            maxLength={PASSWORD_MAX_LENGTH}
            returnKeyType="go"
            onSubmitEditing={() => void handleSignUp()}
            style={[
              commonStyles.input,
              styles.inputTopGap,
              confirmPasswordError ? styles.inputError : confirmPassword ? styles.inputValid : null,
            ]}
          />
          {confirmPasswordError ? (
            <Text style={styles.inlineErrorText}>{confirmPasswordError}</Text>
          ) : null}

          <View style={styles.actionsCenter}>
            <Pressable
              style={[commonStyles.button, styles.submitButton]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={commonStyles.buttonText}>
                {loading ? t("auth.signup.submitting") : t("auth.signup.submit")}
              </Text>
            </Pressable>
          </View>

          {error ? (
            <Text style={styles.errorText}>
              {error}
            </Text>
          ) : null}

          {success ? (
            <Text style={styles.successText}>
              {t("auth.signup.successRedirect")}
            </Text>
          ) : null}

          <Pressable onPress={() => router.push("/(auth)/login")} style={styles.navLinkWrap}>
            <Text style={styles.navLinkText}>
              {t("auth.signup.backToLogin")}
            </Text>
          </Pressable>
        </View>
      </View>
    </PageShell>
  );
}
