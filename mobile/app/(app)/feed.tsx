import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { commonStyles as styles } from "@/styles/common";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";
import { getCurrentUser } from "@/utils/currentUser";
import { PostList } from "@/components/feed/PostList";
import { FeedHeader } from "@/components/layout/FeedHeader";
import { Composer } from "@/components/feed/Composer";


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

 
 <FeedHeader title="Feed" />

    <Composer
  value={content}
  onChange={setContent}
  onPublish={publishPost}
/>

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
