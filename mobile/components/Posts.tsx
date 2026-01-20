import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform
} from "react-native";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { commonStyles as styles } from "@/styles/common";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";

/* ---------------- Types ---------------- */

type User = {
  id: number;
  name: string;
};

type Result =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "getPosts"; posts: Post[] };

export default function Posts() {
  const [result, setResult] = useState<Result>({ type: "idle" });

  /* -------- Composer state -------- */
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [content, setContent] = useState("");

  /* ---------------- Fetch posts ---------------- */

  const getAllPosts = async () => {
    try {
      const data = await graphqlFetch<{ getAllPosts: Post[] }>(`
        query {
          getAllPosts {
            id
            content
            createdAt
            likes
            shares
            user {
              id
              name
            }
          }
        }
      `);

      setResult({ type: "getPosts", posts: data.getAllPosts });
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  /* ---------------- Fetch users ---------------- */

  const getAllUsers = async () => {
    const data = await graphqlFetch<{ getAllUsers: User[] }>(
      `query { getAllUsers { id name } }`
    );
    setUsers(data.getAllUsers);
    if (data.getAllUsers.length > 0) {
      setSelectedUserId(data.getAllUsers[0].id);
    }
  };

  /* ---------------- Add post ---------------- */

 const publishPost = async () => {
  if (!selectedUserId || !content.trim()) {
    window.alert("Select a user and enter content.");
    return;
  }

  await graphqlFetch(`
    mutation {
      addPost(
        content: "${content.replace(/"/g, '\\"')}"
      ) {
        id
      }
    }
  `);

  setContent("");
  getAllPosts();
};

  /* ---------------- Delete post ---------------- */

  const deletePost = async (postId: number) => {
    try {
      await graphqlFetch(`
        mutation {
          deletePost(postId: ${postId})
        }
      `);

      getAllPosts();
    } catch {
      window.alert("Failed to delete post");
    }
  };

  const confirmDelete = (postId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (confirmed) {
      deletePost(postId);
    }
  };

  /* ---------------- Load on mount ---------------- */

  useEffect(() => {
    getAllUsers();
    getAllPosts();
  }, []);

  /* ---------------- Render ---------------- */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posts</Text>

      {/* ---------- COMPOSER ---------- */}
      <View style={feedStyles.feedOuter}>
        <View style={feedStyles.feedContainer}>
          <View
            style={{
              padding: 12,
              borderBottomWidth: 2,
              borderColor: "#000",
            }}
          >
            {Platform.OS === "web" ? (
  <select
    value={selectedUserId ?? ""}
    onChange={(e) => setSelectedUserId(Number(e.target.value))}
    style={{
      width: "100%",
      padding: 8,
      border: "1px solid black",
      marginBottom: 8,
    }}
  >
    {users.map((u) => (
      <option key={u.id} value={u.id}>
        {u.name}
      </option>
    ))}
  </select>
) : (
  <Text style={{ fontSize: 12 }}>
    User selection not implemented on native yet
  </Text>
)}

            <TextInput
              multiline
              value={content}
              onChangeText={setContent}
              placeholder="What's happening?"
              style={{
                borderWidth: 1,
                borderColor: "#000",
                padding: 10,
                minHeight: 120,
                marginTop: 8,
                textAlignVertical: "top",
              }}
            />

            <TouchableOpacity
              onPress={publishPost}
              style={{
                alignSelf: "flex-end",
                marginTop: 10,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: "#000",
              }}
            >
              <Text style={{ fontWeight: "700" }}>Publish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ---------- FEED ---------- */}
      <View style={{ flex: 1 }}>
        {result.type === "error" && (
          <Text style={feedStyles.error}>{result.message}</Text>
        )}

        {result.type === "getPosts" && (
          <View style={feedStyles.feedOuter}>
            <View style={feedStyles.feedContainer}>
              <FlatList
                data={result.posts}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={feedStyles.feedContent}
                ItemSeparatorComponent={() => (
                  <View style={feedStyles.separator} />
                )}
                renderItem={({ item }) => (
                  <View style={feedStyles.postCard}>
                    <TouchableOpacity
                      style={feedStyles.deleteButton}
                      activeOpacity={0.7}
                      onPress={() => confirmDelete(item.id)}
                    >
                      <Text style={feedStyles.deleteText}>DELETE</Text>
                    </TouchableOpacity>

                    <Text style={feedStyles.author}>
                      User name: {item.user.name}
                    </Text>

                    <Text style={feedStyles.content}>{item.content}</Text>

                    <View style={feedStyles.footer}>
                      <Text style={feedStyles.timestamp}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>

                      <View style={feedStyles.stats}>
                        <Text style={feedStyles.stat}>👍 {item.likes}</Text>
                        <Text style={feedStyles.stat}>🔁 {item.shares}</Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
