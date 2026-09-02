import React, { useEffect, useState } from "react";
import {
  Dimensions,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { commonStyles as styles } from "@/styles";
import { AppHeaderActions } from "@/components/layout/AppHeaderActions";
import {
  changeMyEmail,
  changeMyPassword,
  deleteMyAccount,
  isEmailUsed,
  updateMyProfile,
} from "@/graphql/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfileMeta } from "@/hooks/useProfileMeta";
import { Header } from "@/components/layout/Header";
import { PageShell } from "@/components/layout/PageShell";
import {
  profileSettingsAccountInputToneStyle,
  profileSettingsModalSizeStyle,
  profileSettingsPickerItemStyle,
  profileSettingsStyles as local,
  profileSettingsSuccessToneStyle,
} from "@/styles";

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

const GRADIENT_COLORS: [string, string, string, string, string, string] = [
  "rgba(0,0,0,1)",
  "rgba(0,0,0,0.85)",
  "rgba(0,0,0,0.5)",
  "rgba(0,0,0,0.25)",
  "rgba(0,0,0,0.1)",
  "transparent",
];
const GRADIENT_LOCATIONS: [number, number, number, number, number, number] = [
  0, 0.2, 0.4, 0.55, 0.65, 0.8,
];

type About = {
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
};

type EmailForm = {
  newEmail: string;
  confirmNewEmail: string;
  currentPassword: string;
};

type PasswordForm = {
  newPassword: string;
  confirmNewPassword: string;
  currentPassword: string;
};

type AccountForm = {
  email: EmailForm;
  password: PasswordForm;
};

export default function ProfileSettingsScreen() {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const router = useRouter();
  const { logout } = useAuth();

  const { profileMeta, loading, refreshProfileMeta } = useProfileMeta();

  const [activeTab, setActiveTab] = useState<"about" | "account">("about");
  const [pickerType, setPickerType] = useState<"cover" | "avatar" | null>(null);
  const [aboutDraft, setAboutDraft] = useState<About>(() => ({
    displayName: profileMeta?.displayName ?? "",
    bio: profileMeta?.bio ?? "",
    avatarUrl: profileMeta?.avatarUrl ?? "",
    coverUrl: profileMeta?.coverUrl ?? "",
  }));

  const [accountForm, setAccountForm] = useState<AccountForm>({
    email: {
      newEmail: "",
      confirmNewEmail: "",
      currentPassword: "",
    },
    password: {
      newPassword: "",
      confirmNewPassword: "",
      currentPassword: "",
    },
  });

  //email and password change sections have their own current password input fields for better ux
  const [accountUi, setAccountUi] = useState({
    showCurrentPasswordForEmailChange: false, // user's current pw
    showCurrentPasswordForPasswordChange: false, // user's current pw
    showCurrentPasswordForDelete: false,
    showNewPassword: false,
    showConfirmNewPassword: false,
  });

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccessVisible, setDeleteSuccessVisible] = useState(false);
  const [successNoticeVisible, setSuccessNoticeVisible] = useState(false);
  const [successNoticeMessage, setSuccessNoticeMessage] = useState("");
  const successNoticeY = React.useRef(new Animated.Value(-80)).current;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateAccountForm = (section: keyof AccountForm, field: string, value: string) => {
    setAccountForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const closePicker = () => setPickerType(null);

  const validateEmailChange = (email: string, confirm: string, password: string): string | null => {
    if (!email && !confirm && !password) return "Please fill in the fields to change your email.";
    if (!email) return "Please enter a new email.";
    if (!confirm) return "Please confirm your new email.";
    if (!password) return "Please enter your current password.";
    if (password.length < 8) return "Current password must be at least 8 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
    if (email !== confirm) return "Email and confirmation do not match.";
    if (email === profileMeta?.email) return "This is already your current email."; //profileMeta exists before exec comes here
    return null;
  };

  const validatePasswordChange = (newPassword: string, confirmPassword: string, currentPassword: string): string | null => {
    if (!newPassword || !confirmPassword) return "Please enter and confirm your new password.";
    if (newPassword !== confirmPassword) return "New password and confirmation do not match.";
    if (newPassword.length < 8) return "Password must be at least 8 characters.";
    if (!currentPassword) return "Current password is required to change password.";
    if (currentPassword === newPassword) return "The new password and current password you entered are the same.";
    if (currentPassword.length < 8) return "Password must be at least 8 characters.";
    return null;
  };

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

  const hideSuccessNotice = () => {
    Animated.timing(successNoticeY, {
      toValue: -80,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSuccessNoticeVisible(false);
      setSuccessNoticeMessage("");
    });
  };

  //hide success notice on timeout
  useEffect(() => {
    if (!successNoticeVisible) {
      return;
    }

    const timeoutId = setTimeout(hideSuccessNotice, 1600);

    return () => clearTimeout(timeoutId);
  }, [successNoticeVisible]);

  //hydrate about tab's fields with profile meta
  useEffect(() => {
    if (!profileMeta) return;

    setAboutDraft({
      displayName: profileMeta.displayName,
      bio: profileMeta.bio,
      avatarUrl: profileMeta.avatarUrl,
      coverUrl: profileMeta.coverUrl,
    });
  }, [profileMeta]);


  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!profileMeta) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const handleSelectImage = (uri: string) => {
    if (pickerType === "cover") {
      setAboutDraft({ ...aboutDraft, coverUrl: uri });
    }

    if (pickerType === "avatar") {
      setAboutDraft({ ...aboutDraft, avatarUrl: uri });
    }

    setPickerType(null);
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    const aboutDraftChanged =
      aboutDraft.displayName !== profileMeta.displayName ||
      aboutDraft.bio !== profileMeta.bio ||
      aboutDraft.avatarUrl !== profileMeta.avatarUrl ||
      aboutDraft.coverUrl !== profileMeta.coverUrl;

    if (!aboutDraftChanged) {
      setError(null);
      setSuccess("There are no changes to update.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateMyProfile({
        displayName: aboutDraft.displayName,
        bio: aboutDraft.bio,
        avatarUrl: aboutDraft.avatarUrl,
        coverUrl: aboutDraft.coverUrl,
      });

      await refreshProfileMeta();
      setSuccess("Profile updated");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailError(null);

    const email = accountForm.email.newEmail.trim();
    const confirm = accountForm.email.confirmNewEmail.trim();
    const password = accountForm.email.currentPassword.trim();

    const validationError = validateEmailChange(email, confirm, password);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setSaving(true);

    try {
      const emailAlreadyUsed = await isEmailUsed(email);
      if (emailAlreadyUsed) {
        setEmailError("This email address is already in use.");
        return;
      }

      await changeMyEmail(password, email);
      showSuccessNotice("Email changed successfully. Redirecting...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.replace("/(auth)/verify-mail");
    } catch (err) {
      if (err instanceof Error && err.message === "Too Many Requests") {
        setEmailError("Too many verification emails sent. Please wait before trying again.");
      } else {
        setEmailError(err instanceof Error ? err.message : "Failed to change email.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    const newPassword = accountForm.password.newPassword.trim();
    const confirmPassword = accountForm.password.confirmNewPassword.trim();
    const currentPassword = accountForm.password.currentPassword.trim();

    const validationError = validatePasswordChange(newPassword, confirmPassword, currentPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setSaving(true);
    try {
      const changed = await changeMyPassword(currentPassword, newPassword);
      if (changed) {
        setAccountForm(prev => ({
          ...prev,
          password: {
            newPassword: "",
            confirmNewPassword: "",
            currentPassword: "",
          },
        }));
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

  const handleDeleteAccount = async () => {
    if (deleting) {
      return;
    }

    setDeleteError(null);

    const currentPassword = deletePassword.trim();

    if (!currentPassword) {
      setDeleteError("Current password is required to delete your account.");
      return;
    }

    if (currentPassword.length < 8) {
      setDeleteError("Current password must be at least 8 characters.");
      return;
    }

    setDeleting(true);

    try {
      const deleted = await deleteMyAccount(currentPassword);

      if (!deleted) {
        setDeleteError("Failed to delete account.");
        return;
      }

      setDeletePassword("");
      setDeleteSuccessVisible(true);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteSuccess = async () => {
    setDeleteSuccessVisible(false);
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <PageShell
      header={<Header title="BookBook" rightActions={<AppHeaderActions mode="settings" username={profileMeta.username} />} />}
      contentContainerStyle={local.contentFlexGrow}
    >
      {successNoticeVisible && (
        <Animated.View
          style={[local.successNotice, { transform: [{ translateY: successNoticeY }] }]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={local.successNoticeText}>{successNoticeMessage}</Text>
        </Animated.View>
      )}

      <View style={local.flex1}>
        {/* Tabs */}
        <View style={local.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as "about" | "account")}
              style={[
                local.tabButton,
                activeTab === tab.key ? local.tabButtonActive : local.tabButtonInactive,
              ]}
            >
              <Text style={activeTab === tab.key ? local.tabLabelActive : local.tabLabelInactive}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "about" && (
          <ScrollView style={local.flex1} contentContainerStyle={local.aboutScrollContent}>
            <View style={local.coverContainer}>
              <TouchableOpacity activeOpacity={1} style={local.flex1} disabled={true}>
                <Image source={{ uri: aboutDraft.coverUrl }} style={local.coverImage} resizeMode="cover" />
                <LinearGradient
                  colors={GRADIENT_COLORS}
                  locations={GRADIENT_LOCATIONS}
                  style={local.coverGradient}
                  start={{ x: 0.5, y: 1 }}
                  end={{ x: 0.5, y: 0 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={1}
                style={local.coverEditButton}
                onPress={() => setPickerType("cover")}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={1} style={local.avatarWrapper} disabled={true}>
                <Image source={{ uri: aboutDraft.avatarUrl }} style={local.avatarImage} resizeMode="cover" />
                <LinearGradient
                  colors={GRADIENT_COLORS}
                  locations={GRADIENT_LOCATIONS}
                  style={local.avatarGradient}
                  start={{ x: 0.5, y: 1 }}
                  end={{ x: 0.5, y: 0 }}
                />
                <TouchableOpacity onPress={() => setPickerType("avatar")} style={local.avatarEditButton}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            <View style={local.card}>
              <Text style={local.fieldLabel}>Display name</Text>
              <TextInput
                value={aboutDraft.displayName}
                onChangeText={displayName => setAboutDraft({ ...aboutDraft, displayName })}
                placeholder="Display name"
                style={local.textInput}
                maxLength={50}
              />

              <Text style={local.fieldLabel}>Bio</Text>
              <TextInput
                value={aboutDraft.bio}
                onChangeText={bio => setAboutDraft({ ...aboutDraft, bio })}
                placeholder="Tell people a bit about yourself"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                style={local.bioInput}
                maxLength={160}
              />

              {!!error && <Text style={local.errorText}>{error}</Text>}

              {!!success && (
                <Text
                  style={[
                    local.successText,
                    profileSettingsSuccessToneStyle(success === "Profile updated"),
                  ]}
                >
                  {success}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[local.primaryButton, local.saveButton, saving && local.buttonSaving]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={local.primaryButtonText}>Save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {activeTab === "account" && (
          <ScrollView style={local.flex1} contentContainerStyle={local.accountScrollContent}>
            <View style={local.accountCard}>
              {/* Username (not editable) */}
              <Text style={local.fieldLabel}>Username</Text>
              <Text style={local.usernameValue}>{profileMeta.username}</Text>
              <Text style={local.usernameHint}>Your username is not changeable.</Text>

              {/* ── Email section ── */}
              <Text style={local.fieldLabel}>Current Email</Text>
              <Text style={local.currentEmailValue}>{profileMeta.email}</Text>

              <Text style={local.fieldLabelTight}>New Email</Text>
              <TextInput
                value={accountForm.email.newEmail}
                onChangeText={(val) => updateAccountForm("email", "newEmail", val)}
                placeholder="Enter new email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  local.accountInput,
                  profileSettingsAccountInputToneStyle(!!accountForm.email.newEmail),
                ]}
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                value={accountForm.email.confirmNewEmail}
                onChangeText={(val) => updateAccountForm("email", "confirmNewEmail", val)}
                placeholder="Confirm new email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={[
                  local.accountInput,
                  profileSettingsAccountInputToneStyle(!!accountForm.email.confirmNewEmail),
                ]}
                placeholderTextColor="#9ca3af"
              />
              <View style={local.passwordFieldWrapper}>
                <TextInput
                  value={accountForm.email.currentPassword}
                  onChangeText={(val) => updateAccountForm("email", "currentPassword", val)}
                  placeholder="Current password"
                  secureTextEntry={!accountUi.showCurrentPasswordForEmailChange}
                  style={[
                    local.accountInput,
                    local.passwordInput,
                    profileSettingsAccountInputToneStyle(!!accountForm.email.currentPassword),
                  ]}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() =>
                    setAccountUi(prev => ({
                      ...prev,
                      showCurrentPasswordForEmailChange: !prev.showCurrentPasswordForEmailChange,
                    }))
                  }
                  style={local.eyeButton}
                >
                  <Ionicons
                    name={accountUi.showCurrentPasswordForEmailChange ? "eye-off" : "eye"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {!!emailError && <Text style={local.errorTextSmall}>{emailError}</Text>}

              <TouchableOpacity
                onPress={handleChangeEmail}
                disabled={saving}
                style={[local.primaryButton, local.changeEmailButton, saving && local.buttonSaving]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={local.primaryButtonText}>Change Email</Text>
                )}
              </TouchableOpacity>

              {/* ── Password section ── */}
              <Text style={local.fieldLabelTight}>New Password</Text>
              <View style={local.passwordFieldWrapper}>
                <TextInput
                  value={accountForm.password.newPassword}
                  onChangeText={(val) => updateAccountForm("password", "newPassword", val)}
                  placeholder="Enter new password"
                  secureTextEntry={!accountUi.showNewPassword}
                  style={[
                    local.accountInput,
                    local.passwordInput,
                    profileSettingsAccountInputToneStyle(!!accountForm.password.newPassword),
                  ]}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() => setAccountUi(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                  style={local.eyeButton}
                >
                  <Ionicons name={accountUi.showNewPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={local.passwordFieldWrapper}>
                <TextInput
                  value={accountForm.password.confirmNewPassword}
                  onChangeText={(val) => updateAccountForm("password", "confirmNewPassword", val)}
                  placeholder="Confirm new password"
                  secureTextEntry={!accountUi.showConfirmNewPassword}
                  style={[
                    local.accountInput,
                    local.passwordInput,
                    profileSettingsAccountInputToneStyle(!!accountForm.password.confirmNewPassword),
                  ]}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() =>
                    setAccountUi(prev => ({ ...prev, showConfirmNewPassword: !prev.showConfirmNewPassword }))
                  }
                  style={local.eyeButton}
                >
                  <Ionicons name={accountUi.showConfirmNewPassword ? "eye-off" : "eye"} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <View style={local.passwordFieldWrapper}>
                <TextInput
                  value={accountForm.password.currentPassword}
                  onChangeText={(val) => updateAccountForm("password", "currentPassword", val)}
                  placeholder="Current password"
                  secureTextEntry={!accountUi.showCurrentPasswordForPasswordChange}
                  style={[
                    local.accountInput,
                    local.passwordInput,
                    profileSettingsAccountInputToneStyle(!!accountForm.password.currentPassword),
                  ]}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() =>
                    setAccountUi(prev => ({
                      ...prev,
                      showCurrentPasswordForPasswordChange: !prev.showCurrentPasswordForPasswordChange,
                    }))
                  }
                  style={local.eyeButton}
                >
                  <Ionicons
                    name={accountUi.showCurrentPasswordForPasswordChange ? "eye-off" : "eye"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {!!passwordError && <Text style={local.errorTextSmall}>{passwordError}</Text>}

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={saving}
                style={[local.primaryButton, saving && local.buttonSaving]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={local.primaryButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>

              <View style={local.deleteSectionDivider} />

              <Text style={local.deleteTitle}>Delete Account</Text>
              <Text style={local.deleteHint}>This permanently removes your account and related data.</Text>

              <View style={local.passwordFieldWrapper}>
                <TextInput
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Current password"
                  secureTextEntry={!accountUi.showCurrentPasswordForDelete}
                  style={[
                    local.accountInput,
                    local.passwordInput,
                    profileSettingsAccountInputToneStyle(!!deletePassword),
                  ]}
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity
                  onPress={() =>
                    setAccountUi(prev => ({
                      ...prev,
                      showCurrentPasswordForDelete: !prev.showCurrentPasswordForDelete,
                    }))
                  }
                  style={local.eyeButton}
                >
                  <Ionicons
                    name={accountUi.showCurrentPasswordForDelete ? "eye-off" : "eye"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {!!deleteError && <Text style={local.errorTextSmall}>{deleteError}</Text>}

              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleting}
                style={[local.deleteButton, deleting && local.buttonSaving]}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={local.deleteButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      <Modal
        visible={deleteSuccessVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteSuccess}
      >
        <View style={local.modalOverlay}>
          <View style={local.deleteSuccessCard}>
            <Text style={local.modalTitle}>Account deleted successfully. Goodbye!</Text>
            <TouchableOpacity onPress={handleCloseDeleteSuccess} style={local.primaryButton}>
              <Text style={local.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={pickerType !== null} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={local.modalOverlay}>
          <View
            style={[
              local.modalCard,
              profileSettingsModalSizeStyle(screenWidth, screenHeight),
            ]}
          >
            <Text style={local.modalTitle}>
              {pickerType === "cover" ? "Pick a cover" : "Pick a profile photo"}
            </Text>

            <View style={local.modalGrid}>
              {(pickerType === "cover" ? coverOptions : avatarOptions).map(uri => {
                const selected =
                  pickerType === "cover" ? aboutDraft.coverUrl === uri : aboutDraft.avatarUrl === uri;

                const imageSize =
                  pickerType === "cover" ? Math.round(screenWidth * 0.22) : Math.round(screenWidth * 0.16);

                return (
                  <TouchableOpacity
                    key={uri}
                    onPress={() => handleSelectImage(uri)}
                    style={[
                      local.pickerItem,
                      profileSettingsPickerItemStyle(imageSize, pickerType === "cover", selected),
                    ]}
                  >
                    <Image source={{ uri }} style={local.pickerItemImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={closePicker} style={local.modalCloseButton}>
              <Text style={local.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

