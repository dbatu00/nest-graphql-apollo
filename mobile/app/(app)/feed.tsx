import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { commonStyles as styles } from "@/styles/common";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";
import { getCurrentUser } from "@/utils/currentUser";
import { logout } from "@/utils/logout";
import { PostItem } from "@/components/feed/PostItem";
import { PostList } from "@/components/feed/PostList";


export default function Posts() {
  const [result, setResult] = useState<{
    type: "idle" | "error" | "getPosts";
    posts?: Post[];
    message?: string;
  }>({ type: "idle" });

  const [content, setContent] = useState("");
const [currentUserId, setCurrentUserId] = useState<number | null>(null);

useEffect(() => {
  getCurrentUser()
    .then(user => {
      console.log("Current user:", user);
      setCurrentUserId(user.id);
    })
    .catch(() => {
      console.log("Not authenticated");
    });
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

      <View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 2,
    borderColor: "#000",
  }}
>
  <Text style={{ fontWeight: "700", fontSize: 18 }}>
    Feed
  </Text>

  <TouchableOpacity
    onPress={logout}
    style={{
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: "#000",
    }}
  >
    <Text style={{ fontWeight: "700" }}>Logout</Text>
  </TouchableOpacity>
</View>
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
  <PostList
    posts={result.posts}
    currentUserId={currentUserId}
    onDelete={confirmDelete}
  />
)}
    </View>
  );
}
