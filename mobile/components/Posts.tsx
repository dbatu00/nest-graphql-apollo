import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { commonStyles as styles } from "@/styles/common";
import { Post } from "@/types/Post";
import { feedStyles } from "@/styles/feed";

type Result =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "getPosts"; posts: Post[] };

export default function Posts() {
  const [result, setResult] = useState<Result>({ type: "idle" });

  // ---------------------------
  // Fetch posts
  // ---------------------------
  const getAllPosts = async () => {
    try {
      const data = await graphqlFetch<{
        getAllPosts: Post[];
      }>(`
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

  // ---------------------------
  // Delete post
  // ---------------------------
  const deletePost = async (postId: number) => {
    try {
      await graphqlFetch<{
        deletePost: boolean;
      }>(`
        mutation {
          deletePost(postId: ${postId})
        }
      `);

      // Refresh feed
      getAllPosts();
    } catch {
      window.alert("Failed to delete post");
    }
  };

  // ---------------------------
  // Confirm delete (WEB-SAFE)
  // ---------------------------
  const confirmDelete = (postId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (confirmed) {
      deletePost(postId);
    }
  };

  // Load posts on mount
  useEffect(() => {
    getAllPosts();
  }, []);

  // ---------------------------
  // Render
  // ---------------------------
  const renderResult = () => {
    if (result.type === "error") {
      return <Text style={feedStyles.error}>{result.message}</Text>;
    }

    if (result.type === "getPosts") {
      return (
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
                  {/* DELETE BUTTON */}
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

                  <Text style={feedStyles.content}>
                    {item.content}
                  </Text>

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
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posts</Text>

      {/* REQUIRED FOR SCROLL */}
      <View style={{ flex: 1 }}>
        {renderResult()}
      </View>
    </View>
  );
}
