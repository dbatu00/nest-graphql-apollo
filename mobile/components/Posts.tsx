import React, { useState } from "react";
import {
  Platform,
  View,
  Button,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
} from "react-native";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { commonStyles as styles} from "@/styles/common";
import { Post } from "@/types/post";

export default function Posts() {


type Result =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "getPosts"; posts: Post[] }
;
  const [result, setResult] = useState<Result>({ type: "idle" });

  // --- Handlers ---
  const getAllPosts = async () => {
   
      try {
       const data = await graphqlFetch<{
        getAllPosts: Post[];
     }>
        (`
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
      return;
    
    
  };

  // --- Render ---
  const renderResult = () => {
    if (result.type === "error") {
      return <Text style={{ marginTop: 10, color: "red" }}>{result.message}</Text>;
    }

    if(result.type === "getPosts"){

    return (
      <FlatList
        data={result.posts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
       renderItem={({ item }) => (
  <View style={styles.card}>
    <Text style={{ fontWeight: "600" }}>{item.user.name}</Text>

    <Text style={{ marginVertical: 6 }}>
      {item.content}
    </Text>

    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 12, color: "#666" }}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>

      <Text style={{ fontSize: 12, color: "#666" }}>
        👍 {item.likes} · 🔁 {item.shares}
      </Text>
    </View>
  </View>
)}

      />
    );
  }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posts</Text>



      <View style={styles.row}>
        <Button title="Get All Posts" onPress={getAllPosts} />
      </View>

      {renderResult()}
    </View>
  );
}


