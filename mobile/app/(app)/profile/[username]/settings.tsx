import React, { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Image,
} from "react-native";
// Removed drag/zoom functionality
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commonStyles as styles } from "@/styles/common";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { ME_QUERY, UPDATE_MY_PROFILE_MUTATION } from "@/graphql/operations";
import { useAuth } from "@/hooks/useAuth";
import { FeedHeader } from "@/components/layout/FeedHeader";

type MyProfileData = {
  me: {
    id: number;
    username: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
  };
};

type UpdateProfileData = {
  updateMyProfile: {
    id: number;
    username: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
  };
};

const coverOptions = [
  "https://picsum.photos/seed/bookbook-cover-1/1200/600",
  "https://picsum.photos/seed/bookbook-cover-2/1200/600",
  "https://picsum.photos/seed/bookbook-cover-3/1200/600",
  "https://picsum.photos/seed/bookbook-cover-4/1200/600",
  "https://picsum.photos/seed/bookbook-cover-5/1200/600",
  "https://picsum.photos/seed/bookbook-cover-6/1200/600", // new option
];

const avatarOptions = [
  "https://i.pravatar.cc/300?img=11",
  "https://i.pravatar.cc/300?img=12",
  "https://i.pravatar.cc/300?img=13",
  "https://i.pravatar.cc/300?img=14",
  "https://i.pravatar.cc/300?img=15",
];

export default function ProfileSettingsScreen() {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  // Use fixed cover height as in profile page
  const coverHeight = 240;
  // Avatar size stays as before
  const [showCoverGradient, setShowCoverGradient] = useState(false);
  const [showAvatarGradient, setShowAvatarGradient] = useState(false);
  const { username } = useLocalSearchParams<{ username: string | string[] }>();
  const router = useRouter();
  const { user, loading: authLoading, refreshAuth } = useAuth();
  const resolvedUsername = Array.isArray(username) ? username[0] : username;

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
        const data = await graphqlFetch<MyProfileData>(ME_QUERY);

        if (cancelled) {
          return;
        }

        const loadedDisplayName = (data.me.displayName ?? "").trim();
        const loadedBio = (data.me.bio ?? "").trim();
        const loadedAvatarUri = (data.me.avatarUrl ?? "").trim() || avatarOptions[0];
        const loadedCoverUri = (data.me.coverUrl ?? "").trim() || coverOptions[0];

        setDisplayName(loadedDisplayName);
        setBio(loadedBio);
        setSelectedAvatarUri(loadedAvatarUri);
        setSelectedCoverUri(loadedCoverUri);
        setInitialDisplayName(loadedDisplayName);
        setInitialBio(loadedBio);
        setInitialAvatarUri(loadedAvatarUri);
        setInitialCoverUri(loadedCoverUri);
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

    // Check for changes before saving
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
      const data = await graphqlFetch<UpdateProfileData>(UPDATE_MY_PROFILE_MUTATION, {
        displayName,
        bio,
        avatarUrl: selectedAvatarUri,
        coverUrl: selectedCoverUri,
      });

      setDisplayName((data.updateMyProfile.displayName ?? "").trim());
      setBio((data.updateMyProfile.bio ?? "").trim());
      setSelectedAvatarUri((data.updateMyProfile.avatarUrl ?? "").trim() || avatarOptions[0]);
      setSelectedCoverUri((data.updateMyProfile.coverUrl ?? "").trim() || coverOptions[0]);
      setSuccess("Profile updated");
      await refreshAuth();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
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
      <FeedHeader title="BookBook" />

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
            disabled={true} // Disable clickability
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
            disabled={true} // Disable clickability for the image
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

                // Make selection images smaller
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
