/* TODO:
1-) username only accepts pure strings;
does accept empty string => shouldnt
does not accept strings like test5 => should
2-)getAllUsers try catch clean
3-)deleteUser option to force
4-) usernotfound visible when page is first opened


*/

import React, { useState } from "react";
import {
  View,
  Button,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
} from "react-native";

const GRAPHQL_URL = "http://192.168.1.7:3000/graphql";

export default function UsersDemo() {
  const [userId, setUserId] = useState(""); // userid type is inferred
  const [userIdToDelete, setUserIdToDelete] = useState(""); // userid type is inferred
  const [userName, setUserName] = useState("");
  const [result, setResult] = useState<any>(null);

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

    try {
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        alert("Failed to fetch users");
        return;
      }

      // instead of JSON.stringify, store the array directly
      setResult(data.data.getUsers);
    } catch (err) {
      console.error("getAllUsers failed:", err);
      alert("Error fetching users");
    }
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

      setResult(result.getUser); // store the object directly
    } catch (err) {
      console.error("getUser failed:", err);
      setResult({ error: String(err) }); // optional: store as object
    }
  };

  const addUser = async () => {
    if (/\d/.test(userName)) {
      alert("User name cannot contain digits.");
      return;
    }

    const mutation = `
      mutation($name: String!) {
        addUser(name: $name) {
          id
          name
        }
      }
    `;

    try {
      const result = await graphqlFetch<{
        addUser: { id: number; name: string } | null;
      }>(mutation, { name: userName });

      setResult(result.addUser); // store the object directly
    } catch (err) {
      console.error("addUser failed:", err);
      setResult({ error: String(err) }); // optional: store as object
    }
  };

  const deleteUser = async () => {
    const mutation = `
      mutation($id: Int!) {
        deleteUser(id: $id) {
          affected
          name
          id
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
    console.log("deleteUser response:", data.data.deleteUser);
    setResult(data.data.deleteUser);
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
      {Array.isArray(result) ? (
        // ✅ Case 1: List of users (getAllUsers)
        <FlatList
          data={result}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: 10,
          }}
          contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardId}>ID: {item.id}</Text>
            </View>
          )}
        />
      ) : result ? (
        // ✅ Case 2: deleteUser response
        result.affected !== undefined ? (
          <Text style={{ marginTop: 10, color: "red" }}>
            Deleted:
            {"\n"}
            ID: {result.id}
            {"\n"}
            Name: {result.name}
            {"\n"}
            Rows affected: {result.affected}
          </Text>
        ) : result.id && result.name ? (
          // ✅ Case 3: Single user (getUser, addUser)
          <Text style={{ marginTop: 10 }}>
            ID: {result.id}
            {"\n"}
            Name: {result.name}
          </Text>
        ) : (
          // ✅ Case 4: unexpected object
          <Text style={{ marginTop: 10, color: "red" }}>
            Error: User id or name not received from server
          </Text>
        )
      ) : (
        // ✅ Case 5: null / undefined
        <Text style={{ marginTop: 10, color: "red" }}>User not found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  row: { flexDirection: "row", marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  cardName: { fontWeight: "bold", fontSize: 18 },
  cardId: { color: "#666", marginTop: 4 },
});
