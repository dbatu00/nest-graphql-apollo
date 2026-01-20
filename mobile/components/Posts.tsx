import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { commonStyles as styles } from "@/styles/common";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  sub: number; // user id
  username: string;
  iat: number;
  exp: number;
};

export default function Posts() {
  const [result, setResult] = useState<{
    type: "idle" | "error" | "getPosts";
    posts?: Post[];
    message?: string;
  }>({ type: "idle" });

  const [content, setContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  /* ---------- AUTH ---------- */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("No auth token found");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setCurrentUserId(decoded.sub);
      console.log("Current user id:", decoded.sub);
    } catch (e) {
      console.warn("Invalid token", e);
    }
  }, []);

  /* ---------- DATA ---------- */
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
            user { id name }
          }
        }
      `);

      setResult({ type: "getPosts", posts: data.getAllPosts });
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  useEffect(() => {
    getAllPosts();
  }, []);

  /* ---------- MUTATIONS ---------- */
  const publishPost = async () => {
    if (!content.trim()) {
      window.alert("Enter content to publish.");
      return;
    }

    await graphqlFetch(`
      mutation {
        addPost(content: "${content.replace(/"/g, '\\"')}") { id }
      }
    `);

    setContent("");
    getAllPosts();
  };

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
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePost(postId);
    }
  };

  /* ---------- UI ---------- */
  return (
    <View style={styles.container}>
      {/* ---------- COMPOSER ---------- */}
      <View style={{ padding: 12, borderBottomWidth: 2, borderColor: "#000" }}>
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

      {/* ---------- FEED ---------- */}
      {result.type === "error" && (
        <Text style={feedStyles.error}>{result.message}</Text>
      )}

      {result.type === "getPosts" && result.posts && (
        <FlatList
          data={result.posts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={feedStyles.feedContent}
          ItemSeparatorComponent={() => <View style={feedStyles.separator} />}
          renderItem={({ item }) => {
            console.log(
              "POST USER:",
              item.user.id,
              "CURRENT USER:",
              currentUserId
            );

            return (
              <View style={feedStyles.postCard}>
                {currentUserId === item.user.id && (
                  <TouchableOpacity
                    style={feedStyles.deleteButton}
                    activeOpacity={0.7}
                    onPress={() => confirmDelete(item.id)}
                  >
                    <Text style={feedStyles.deleteText}>DELETE</Text>
                  </TouchableOpacity>
                )}

                <Text style={feedStyles.author}>
                  User: {item.user.name}
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
            );
          }}
        />
      )}
    </View>
  );
}
