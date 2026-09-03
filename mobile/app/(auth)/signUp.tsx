import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "@/styles";
import { signUp } from "@/graphql/client";
import { Language } from "@/hooks/i18n.translations";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { AppLogo } from "@/components/common/AppLogo";
import { authFormStyles as styles } from "@/styles";

const LANGUAGE_OPTIONS: Language[] = ["en", "tr", "de"];

export default function SignUp() {
  const { setSession } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLanguageSelect = async (option: Language) => {
    await setLanguage(option);
    setLanguageMenuOpen(false);
  };

  const handleSignUp = async () => {
    setError("");
    setUsernameError("");
    setEmailError("");

    if (!username || !email || !password || !confirmPassword) {
      setError(t("auth.signup.error.required"));
      return;
    }

    const trimmedLowerCaseEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedLowerCaseEmail)) {
      setEmailError(t("auth.signup.error.invalidEmail"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.signup.error.passwordsNoMatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("auth.signup.error.passwordLength"));
      return;
    }

    setLoading(true);

    try {
      const authPayload = await signUp(username, trimmedLowerCaseEmail, password);

      await setSession({
        token: authPayload.token,
        refreshToken: authPayload.refreshToken,
        user: authPayload.user,
        emailVerified: authPayload.emailVerified,
      });

      setSuccess(true);

      setTimeout(() => {
        router.replace(authPayload.emailVerified ? "/(app)/feed" : ("/(auth)/verify-mail" as never));
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.signup.error.failed");
      if (msg.toLowerCase().includes("username")) setUsernameError(msg);
      else if (msg.toLowerCase().includes("email")) setEmailError(msg);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[commonStyles.container, commonStyles.center, commonStyles.pageGutter]}>
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
                      {t(`settings.language.${option}`)}
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
          onChangeText={setUsername}
          autoCapitalize="none"
          style={commonStyles.input}
        />
        {usernameError ? (
          <Text style={styles.inlineErrorText}>{usernameError}</Text>
        ) : null}

        <TextInput
          placeholder={t("auth.signup.emailPlaceholder")}
          placeholderTextColor="#d1d5db"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[commonStyles.input, styles.inputTopGap]}
        />
        {emailError ? (
          <Text style={styles.inlineErrorText}>{emailError}</Text>
        ) : null}

        <TextInput
          placeholder={t("auth.signup.passwordPlaceholder")}
          placeholderTextColor="#d1d5db"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[commonStyles.input, styles.inputTopGap]}
        />

        <TextInput
          placeholder={t("auth.signup.confirmPasswordPlaceholder")}
          placeholderTextColor="#d1d5db"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={[commonStyles.input, styles.inputTopGap]}
        />

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
  );
}
