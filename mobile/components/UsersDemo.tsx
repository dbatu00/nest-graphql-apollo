import React, { useState } from "react";
import { View, Button, Text, TextInput, StyleSheet } from "react-native";

const GRAPHQL_URL = "http://192.168.1.7:3000/graphql";

export default function UsersDemo() {
  const [userId, setUserId] = useState(""); // userid type is inferred
  const [userIdToDelete, setUserIdToDelete] = useState(""); // userid type is inferred
  const [userName, setUserName] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function graphqlFetch<T>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    const data = await res.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(data.errors[0]?.message || "GraphQL request failed");
    }

    return data.data as T;
  }

  const getAllUsers = async () => {
    const query = `
      query {
        getUsers {
          id
          name
        }
      }
    `;
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data.data.getUsers, null, 2));
  };

  const getUser = async () => {
    const query = `
    query($id: Int!) {
      getUser(id: $id) {
        id
        name
      }
    }
  `;

    try {
      const result = await graphqlFetch<{
        getUser: { id: number; name: string } | null;
      }>(
        query,
        { id: Number(userId) } // convert to number
      );

      setResult(JSON.stringify(result.getUser, null, 2));
    } catch (err) {
      console.error("getUser failed:", err);
      setResult(`${err}`);
    }
  };

  const addUser = async () => {
    const mutation = `
      mutation($name: String!) {
        addUser(name: $name) {
          id
          name
        }
      }
    `;
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: mutation, variables: { name: userName } }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data.data.addUser, null, 2));
  };

  const deleteUser = async () => {
    const mutation = `
      mutation($id: Int!) {
        deleteUser(id: $id) {
          affected
        }
      }
    `;
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: { id: Number(userIdToDelete) },
      }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data.data.deleteUser, null, 2));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Users Demo</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="User name"
          value={userName}
          onChangeText={setUserName}
        />
        <Button title="Add User" onPress={addUser} />
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={userId}
          onChangeText={setUserId}
          keyboardType="numeric"
        />
        <Button title="Get User" onPress={getUser} />
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={userIdToDelete}
          onChangeText={setUserIdToDelete}
          keyboardType="numeric"
        />
        <Button title="Delete user" onPress={deleteUser} />
      </View>
      <Button title="Get All Users" onPress={getAllUsers} />
      {result && <Text style={styles.result}>{result}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginRight: 8,
    flex: 1,
  },
  result: { marginTop: 24, fontFamily: "monospace" },
});
