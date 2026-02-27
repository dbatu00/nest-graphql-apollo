import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { commonStyles as styles } from "@/styles/common";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { UPDATE_MY_PROFILE_MUTATION, USER_PROFILE_QUERY } from "@/graphql/operations";
import { useAuth } from "@/hooks/useAuth";

type ProfileQueryData = {
  userByUsername: {
    id: number;
    username: string;
    displayName?: string;
    bio?: string;
  } | null;
};

type UpdateProfileData = {
  updateMyProfile: {
    id: number;
    username: string;
    displayName?: string;
    bio?: string;
  };
};

export default function ProfileSettingsScreen() {
  const { username } = useLocalSearchParams<{ username: string | string[] }>();
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const resolvedUsername = Array.isArray(username) ? username[0] : username;

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!resolvedUsername) {
        setLoading(false);
        setError("Missing username");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await graphqlFetch<ProfileQueryData>(USER_PROFILE_QUERY, {
          username: resolvedUsername,
        });

        if (cancelled) {
          return;
        }

        if (!data.userByUsername) {
          setError("Profile not found");
          return;
        }

        setDisplayName(data.userByUsername.displayName ?? "");
        setBio(data.userByUsername.bio ?? "");
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
  }, [resolvedUsername]);

  const handleSave = async () => {
    if (!resolvedUsername || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await graphqlFetch<UpdateProfileData>(UPDATE_MY_PROFILE_MUTATION, {
        displayName,
        bio,
      });

      setDisplayName(data.updateMyProfile.displayName ?? "");
      setBio(data.updateMyProfile.bio ?? "");
      setSuccess("Profile updated");
      await refreshAuth();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (!resolvedUsername) {
      router.push("/feed");
      return;
    }

    router.push({
      pathname: "/profile/[username]",
      params: { username: resolvedUsername },
    });
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
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#fff",
          marginBottom: 12,
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
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={handleBack}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="chevron-back" size={18} color="#2563eb" />
            <Text style={{ color: "#2563eb", fontWeight: "600", fontSize: 14 }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1f2937" }}>Settings</Text>

          <View style={{ width: 48 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
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
            <Text style={{ color: "#16a34a", marginTop: 12 }}>{success}</Text>
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
    </View>
  );
}
