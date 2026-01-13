import React, { useState } from "react";
import {
  View,
  Button,
  Text,
  StyleSheet,
  FlatList,
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
                  <Text style={feedStyles.author}>User name: {item.user.name}</Text>

                  <Text style={feedStyles.content}>
                    Content: {item.content}
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

      <View style={styles.row}>
        <Button title="Get All Posts" onPress={getAllPosts} />
      </View>

      {/* THIS MUST HAVE FLEX */}
      <View style={{ flex: 1 }}>
        {renderResult()}
      </View>
    </View>
  );
}

