import React, { useEffect, useState } from "react";
import {
  Dimensions, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, Modal, Image, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commonStyles as styles } from "@/styles/common";
import {
  changeMyEmail,
  changeMyPassword,
  getMyProfile,
  isEmailUsed,
  updateMyProfile,
} from "@/graphql/client";
import { useAuth } from "@/hooks/useAuth";
import { FeedHeader } from "@/components/layout/FeedHeader";

const coverOptions = [
  "https://picsum.photos/seed/bookbook-cover-1/1200/600",
  "https://picsum.photos/seed/bookbook-cover-2/1200/600",
  "https://picsum.photos/seed/bookbook-cover-3/1200/600",
  "https://picsum.photos/seed/bookbook-cover-4/1200/600",
  "https://picsum.photos/seed/bookbook-cover-5/1200/600",
  "https://picsum.photos/seed/bookbook-cover-6/1200/600",
];

const avatarOptions = [
  "https://i.pravatar.cc/300?img=11",
  "https://i.pravatar.cc/300?img=12",
  "https://i.pravatar.cc/300?img=13",
  "https://i.pravatar.cc/300?img=14",
  "https://i.pravatar.cc/300?img=15",
];

const TABS = [
  { key: "about", label: "About You" },
  { key: "account", label: "Account Details" },
];

export default function ProfileSettingsScreen() {
  const [activeTab, setActiveTab] = useState<"about" | "account">("about");
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const coverHeight = 240;
  const { username } = useLocalSearchParams<{ username: string | string[] }>();
  const router = useRouter();
  const { user, loading: authLoading, refreshAuth } = useAuth();
  const resolvedUsername = Array.isArray(username) ? username[0] : username;

  // About you state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const [initialBio, setInitialBio] = useState("");
  const [initialAvatarUri, setInitialAvatarUri] = useState(avatarOptions[0]);
  const [initialCoverUri, setInitialCoverUri] = useState(coverOptions[0]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCoverUri, setSelectedCoverUri] = useState(coverOptions[0]);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState(avatarOptions[0]);
  const [pickerType, setPickerType] = useState<"cover" | "avatar" | null>(null);

  // Account details state
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState("");
  const [showEmailCurrentPassword, setShowEmailCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showCurrentPasswordForPassword, setShowCurrentPasswordForPassword] = useState(false);

  // Per-section error/success for Account tab
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successNoticeVisible, setSuccessNoticeVisible] = useState(false);
  const [successNoticeMessage, setSuccessNoticeMessage] = useState("");
  const successNoticeY = React.useRef(new Animated.Value(-80)).current;

  const showSuccessNotice = (message: string) => {
    setSuccessNoticeMessage(message);
    setSuccessNoticeVisible(true);
    successNoticeY.setValue(-80);
    Animated.timing(successNoticeY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    if (!successNoticeVisible) {
      return;
    }

    const timeoutId = setTimeout(() => {
      Animated.timing(successNoticeY, {
        toValue: -80,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setSuccessNoticeVisible(false);
        setSuccessNoticeMessage("");
      });
    }, 1600);

    return () => clearTimeout(timeoutId);
  }, [successNoticeVisible, successNoticeY]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (resolvedUsername && user.username !== resolvedUsername) {
      router.replace({
        pathname: "/profile/[username]",
        params: { username: resolvedUsername },
      });
      return;
    }

    let cancelled = false;

    async function load() {
      if (!user?.username) {
        setLoading(false);
        setError("Missing username");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const me = await getMyProfile();

        if (cancelled) {
          return;
        }

        const loadedDisplayName = (me.displayName ?? "").trim();
        const loadedBio = (me.bio ?? "").trim();
        const loadedAvatarUri = (me.avatarUrl ?? "").trim();
        const loadedCoverUri = (me.coverUrl ?? "").trim();
        const loadedEmail = (me.email ?? "").trim();

        setDisplayName(loadedDisplayName);
        setBio(loadedBio);
        setSelectedAvatarUri(loadedAvatarUri);
        setSelectedCoverUri(loadedCoverUri);
        setInitialDisplayName(loadedDisplayName);
        setInitialBio(loadedBio);
        setInitialAvatarUri(loadedAvatarUri);
        setInitialCoverUri(loadedCoverUri);
        setCurrentEmail(loadedEmail);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, resolvedUsername, router]);

  const handleSave = async () => {
    if (!user?.username || saving) {
      return;
    }

    const noChanges =
      displayName.trim() === initialDisplayName.trim() &&
      bio.trim() === initialBio.trim() &&
      selectedAvatarUri === initialAvatarUri &&
      selectedCoverUri === initialCoverUri;

    if (noChanges) {
      setError(null);
      setSuccess("There are no changes to update.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfile = await updateMyProfile({
        displayName,
        bio,
        avatarUrl: selectedAvatarUri,
        coverUrl: selectedCoverUri,
      });

      setDisplayName((updatedProfile.displayName ?? "").trim());
      setBio((updatedProfile.bio ?? "").trim());
      setSelectedAvatarUri((updatedProfile.avatarUrl ?? "").trim());
      setSelectedCoverUri((updatedProfile.coverUrl ?? "").trim());
      setSuccess("Profile updated");
      await refreshAuth();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailError(null);

    const email = newEmail.trim();
    const confirm = confirmNewEmail.trim();
    const password = currentPassword.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email && !confirm && !password) {
      setEmailError("Please fill in the fields to change your email.");
      return;
    }

    if (!email) {
      setEmailError("Please enter a new email.");
      return;
    }

    if (!confirm) {
      setEmailError("Please confirm your new email.");
      return;
    }

    if (!password) {
      setEmailError("Please enter your current password.");
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (email !== confirm) {
      setEmailError("Email and confirmation do not match.");
      return;
    }

    if (email === currentEmail) {
      setEmailError("This is already your current email.");
      return;
    }

    setSaving(true);

    try {
      const emailAlreadyUsed = await isEmailUsed(email);

      if (emailAlreadyUsed) {
        setEmailError("This email address is already in use.");
        return;
      }

      //fail routes throw errors that propagate so no need for extra checks
      await changeMyEmail(password, email);

      setCurrentEmail(email);
      setNewEmail("");
      setConfirmNewEmail("");
      setCurrentPassword("");
      await refreshAuth();
      showSuccessNotice("Email changed successfully. Redirecting...");
      await wait(2000);
      router.replace("/(auth)/verify-mail");

    } catch (err) {
      if (err instanceof Error && err.message === "Too Many Requests") {
        setEmailError("Too many verification emails sent. Please wait before trying again.");
        return;
      }
      setEmailError(err instanceof Error ? err.message : "Failed to change email.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      setPasswordError("Please enter and confirm your new password.");
      return;
    }
    if (newPassword.trim() !== confirmNewPassword.trim()) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.trim().length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    const currentPasswordValue = currentPasswordForPassword.trim();
    if (!currentPasswordValue) {
      setPasswordError("Current password is required to change password.");
      return;
    }
    if (currentPasswordValue === newPassword.trim()) {
      setPasswordError("The new password and current password you entered are the same.");
      return;
    }
    if (currentPasswordForPassword.trim().length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      const changed = await changeMyPassword(currentPasswordValue, newPassword.trim());
      if (changed) {
        setNewPassword("");
        setConfirmNewPassword("");
        setCurrentPasswordForPassword("");
        showSuccessNotice("Password changed successfully.");
      } else {
        setPasswordError("Failed to change password.");
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const closePicker = () => setPickerType(null);

  const handleSelectImage = (uri: string) => {
    if (pickerType === "cover") {
      setSelectedCoverUri(uri);
    }

    if (pickerType === "avatar") {
      setSelectedAvatarUri(uri);
    }

    setPickerType(null);
  };


  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {successNoticeVisible && (
        <Animated.View
          style={{
            position: "absolute",
            top: 12,
            left: 16,
            right: 16,
            zIndex: 20,
            backgroundColor: "#ecfdf5",
            borderColor: "#86efac",
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            transform: [{ translateY: successNoticeY }],
          }}
        >
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={{ color: "#166534", fontWeight: "600", marginLeft: 8 }}>
            {successNoticeMessage}
          </Text>
        </Animated.View>
      )}

      <FeedHeader title="BookBook" />

      {/* Tabs */}
      <View style={{ flexDirection: "row", marginTop: 8, marginBottom: 8, paddingHorizontal: 16 }}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as "about" | "account")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.key ? "#2563eb" : "#e5e7eb",
              alignItems: "center",
            }}
          >
            <Text style={{
              color: activeTab === tab.key ? "#2563eb" : "#6b7280",
              fontWeight: activeTab === tab.key ? "700" : "500",
              fontSize: 15,
            }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "about" && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
          <View
            style={{
              height: coverHeight,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#bfdbfe",
              backgroundColor: "#eff6ff",
              marginBottom: 16,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{ flex: 1 }}
              disabled={true}
            >
              <Image
                source={{ uri: selectedCoverUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(0,0,0,1)", "rgba(0,0,0,0.85)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.1)", "transparent"]}
                locations={[0, 0.2, 0.4, 0.55, 0.65, 0.8]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "100%",
                }}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              style={{
                position: "absolute",
                right: 14,
                top: 14,
                backgroundColor: "rgba(0,0,0,0.55)",
                borderRadius: 16,
                padding: 6,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => setPickerType("cover")}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              style={{
                position: "absolute",
                left: 14,
                bottom: 12,
                width: 84,
                height: 84,
                borderRadius: 42,
                borderWidth: 3,
                borderColor: "#fff",
                backgroundColor: "#dbeafe",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                zIndex: 2,
                elevation: 6,
              }}
              disabled={true}
            >
              <Image
                source={{ uri: selectedAvatarUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(0,0,0,1)", "rgba(0,0,0,0.85)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.1)", "transparent"]}
                locations={[0, 0.2, 0.4, 0.55, 0.65, 0.8]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "100%",
                  borderBottomLeftRadius: 42,
                  borderBottomRightRadius: 42,
                }}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
              />
              <TouchableOpacity
                onPress={() => setPickerType("avatar")}
                style={{
                  position: "absolute",
                  right: 8,
                  bottom: 8,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  borderRadius: 14,
                  padding: 5,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                },
                android: { elevation: 1 },
              }),
            }}
          >
            <Text style={{ fontWeight: "600", color: "#374151", marginBottom: 8 }}>Display name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: "#fff",
                marginBottom: 14,
              }}
              maxLength={50}
            />

            <Text style={{ fontWeight: "600", color: "#374151", marginBottom: 8 }}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people a bit about yourself"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 120,
                backgroundColor: "#fff",
              }}
              maxLength={160}
            />

            {!!error && (
              <Text style={{ color: "#dc2626", marginTop: 12 }}>{error}</Text>
            )}

            {!!success && (
              <Text style={{ color: success === "Profile updated" ? "#16a34a" : "#fbbf24", marginTop: 12 }}>{success}</Text>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                marginTop: 16,
                backgroundColor: "#2563eb",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Save changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {activeTab === "account" && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 }}>
          <View style={{
            backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 18,
            ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 }, android: { elevation: 1 } })
          }}>

            {/* Username (not editable) */}
            <Text style={{ fontWeight: "600", color: "#374151", marginBottom: 2 }}>Username</Text>
            <Text style={{ fontSize: 16, color: "#1e293b", fontWeight: "700", marginBottom: 2 }}>{user?.username || "-"}</Text>
            <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 18 }}>
              Your username is not changeable.
            </Text>

            {/* ── Email section ── */}
            <Text style={{ fontWeight: "600", color: "#374151", marginBottom: 2 }}>Current Email</Text>
            <Text style={{ fontSize: 16, color: "#1e293b", fontWeight: "700", marginBottom: 18 }}>{currentEmail || "-"}</Text>

            <Text style={{ fontWeight: "600", color: "#374151", marginBottom: 4 }}>New Email</Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Enter new email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: "#fff",
                color: newEmail ? "#1e293b" : "#9ca3af",
                marginBottom: 8,
              }}
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              value={confirmNewEmail}
              onChangeText={setConfirmNewEmail}
              placeholder="Confirm new email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: "#fff",
                color: confirmNewEmail ? "#1e293b" : "#9ca3af",
                marginBottom: 8,
              }}
              placeholderTextColor="#9ca3af"
            />
            <View style={{ position: "relative", marginBottom: 8 }}>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                secureTextEntry={!showEmailCurrentPassword}
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  paddingRight: 44,
                  backgroundColor: "#fff",
                  color: currentPassword ? "#1e293b" : "#9ca3af",
                }}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowEmailCurrentPassword(prev => !prev)}
                style={{ position: "absolute", right: 12, top: 10 }}
              >
                <Ionicons name={showEmailCurrentPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {!!emailError && (
              <Text style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{emailError}</Text>
            )}

            <TouchableOpacity
              onPress={handleChangeEmail}
              disabled={saving}
              style={{
                backgroundColor: "#2563eb",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                opacity: saving ? 0.7 : 1,
                marginBottom: 24,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Change Email</Text>
              )}
            </TouchableOpacity>

            {/* ── Password section ── */}
            <Text style={{ fontWeight: "600", color: "#374151", marginBottom: 4 }}>New Password</Text>
            <View style={{ position: "relative", marginBottom: 8 }}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  paddingRight: 44,
                  backgroundColor: "#fff",
                  color: newPassword ? "#1e293b" : "#9ca3af",
                }}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(prev => !prev)}
                style={{ position: "absolute", right: 12, top: 10 }}
              >
                <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={{ position: "relative", marginBottom: 8 }}>
              <TextInput
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmNewPassword}
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  paddingRight: 44,
                  backgroundColor: "#fff",
                  color: confirmNewPassword ? "#1e293b" : "#9ca3af",
                }}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmNewPassword(prev => !prev)}
                style={{ position: "absolute", right: 12, top: 10 }}
              >
                <Ionicons name={showConfirmNewPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={{ position: "relative", marginBottom: 8 }}>
              <TextInput
                value={currentPasswordForPassword}
                onChangeText={setCurrentPasswordForPassword}
                placeholder="Current password"
                secureTextEntry={!showCurrentPasswordForPassword}
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  paddingRight: 44,
                  backgroundColor: "#fff",
                  color: currentPasswordForPassword ? "#1e293b" : "#9ca3af",
                }}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPasswordForPassword(prev => !prev)}
                style={{ position: "absolute", right: 12, top: 10 }}
              >
                <Ionicons name={showCurrentPasswordForPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {!!passwordError && (
              <Text style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{passwordError}</Text>
            )}

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={saving}
              style={{
                backgroundColor: "#2563eb",
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={pickerType !== null}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 14,
              maxWidth: Math.round(screenWidth * 0.85),
              width: Math.round(screenWidth * 0.85),
              maxHeight: Math.round(screenHeight * 0.7),
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 }}>
              {pickerType === "cover" ? "Pick a cover" : "Pick a profile photo"}
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {(pickerType === "cover" ? coverOptions : avatarOptions).map(uri => {
                const selected =
                  pickerType === "cover"
                    ? selectedCoverUri === uri
                    : selectedAvatarUri === uri;

                const imageSize = pickerType === "cover"
                  ? Math.round(screenWidth * 0.22)
                  : Math.round(screenWidth * 0.16);

                return (
                  <TouchableOpacity
                    key={uri}
                    onPress={() => handleSelectImage(uri)}
                    style={{
                      width: imageSize,
                      height: pickerType === "cover" ? Math.round(imageSize * 9 / 16) : imageSize,
                      borderRadius: pickerType === "cover" ? 8 : 999,
                      overflow: "hidden",
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? "#2563eb" : "#d1d5db",
                      marginBottom: 10,
                    }}
                  >
                    <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={closePicker}
              style={{
                alignSelf: "flex-end",
                marginTop: 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: "#f3f4f6",
              }}
            >
              <Text style={{ color: "#374151", fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}