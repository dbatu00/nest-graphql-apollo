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
  // Single form state object
  const [form, setForm] = useState({
    userId: "",
    userIdToDelete: "",
    userName: "",
  });

  type Result =
    | { type: "idle" }
    | { type: "error"; message: string }
    | { type: "all"; users: { id: number; name: string }[] }
    | { type: "one"; user: { id: number; name: string  } | null }
    | { type: "added"; user: { id: number; name: string } }
    | { type: "deleted"; user: { id: number; name: string | null }  };

  const [result, setResult] = useState<Result>({ type: "idle" });

  async function graphqlFetch<T>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    console.log(
      "graphqlFetch called with query:",
      query,
      "variables:",
      variables
    );

    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    const data = await res.json();
    console.log("graphqlFetch response:", data);

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(data.errors[0]?.message || "GraphQL request failed");
    }

    return data.data as T;
  }

  //{getUser: { id: number; name: string } | null} this is what graphql will return, hence the  <{type declaration}>
  //this is so that react client and graphql can handshake on data structure
  //there are ways to avoid typing graphql objects by hand with libraries frameworks etc
  const getUser = async () => {
    if (!/^\d+$/.test(form.userId)) {
      alert("User ID must be a number.");
      return;
    }
    const query = `query($id: Int!) { getUser(id: $id) { id name } }`;
    try {
      const data = await graphqlFetch<{
        getUser: { id: number; name: string } | null;
      }>(query, { id: Number(form.userId) });
      setResult({ type: "one", user: data.getUser });
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  const getAllUsers = async () => {
    const query = `query { getUsers { id name } }`;
    try {
      const data = await graphqlFetch<{
        getUsers: { id: number; name: string }[];
      }>(query);
      setResult({ type: "all", users: data.getUsers });
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  // Flow of addUser:
  // 1. Send request to server to create a user with the given name.
  // 2. Server either returns the created user, or indicates the user already exists.
  // 3. If user is created successfully, set result and exit.
  // 4. If user exists, ask the end user whether to overwrite.
  // 5. If user confirms, send request again with force=true, then set result.
  // 6. If user cancels, set result to error message and exit.
  const addUser = async () => {
    // Validate input: must start with a letter,
    // can have with digits, but not only digits
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(form.userName)) {
      alert(
        "User name must start with a letter and can only contain letters or digits."
      );
      return;
    }

    const mutation = `
    mutation($input: AddUserInput!) {
      addUser(addUserInput: $input) {
        user { id name }
        userExists
      }
    }`;

    try {
      let data = await graphqlFetch<{
        addUser: { user?: { id: number; name: string }; userExists?: boolean };
      }>(mutation, { input: { name: form.userName } });

      if (data.addUser.user) {
        setResult({ type: "added", user: data.addUser.user });
      } else if (data.addUser.userExists) {
        const confirmForce = window.confirm("User already exists. Overwrite?");
        if (confirmForce) {
          data = await graphqlFetch(mutation, {
            input: { name: form.userName, force: true },
          });
          setResult({ type: "added", user: data.addUser.user! });
        } else {
          setResult({ type: "error", message: "User creation cancelled." });
        }
      }
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  const deleteUser = async () => {
    if (!/^\d+$/.test(form.userIdToDelete)) {
      alert("User ID must be a number.");
      return;
    }

    const mutation = `
    mutation($id: Int!) {
      deleteUser(id: $id) {
        id
        name
      }
    }`;
    try {
      const data = await graphqlFetch<{
        deleteUser: { id: number; name: string | null };
      }>(mutation, { id: Number(form.userIdToDelete) });
      setResult({ type: "deleted", user: data.deleteUser });
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  const renderResult = () => {
    switch (result.type) {
      case "idle":
        return null;

      case "error":
        return (
          <Text style={{ marginTop: 10, color: "red" }}>{result.message}</Text>
        );

      case "all":
        return (
          <FlatList
            data={result.users}
            keyExtractor={(item) => item.id.toString()}
            numColumns={5}
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
        );

      case "one":
        return result.user ? (
          <Text style={{ marginTop: 10 }}>
            ID: {result.user.id}
            {"\n"}Name: {result.user.name}
          </Text>
        ) : (
          <Text style={{ marginTop: 10, color: "red" }}>User not found</Text>
        );

      case "added":
      case "deleted":
        if (!result.user || (result.type === "deleted" && !result.user.name)) {
          return (
            <Text style={{ marginTop: 10, color: "red" }}>User not found.</Text>
          );
        }

        const label = result.type === "added" ? "Added" : "Deleted";
        return (
          <Text
            style={{
              marginTop: 10,
              color: result.type === "deleted" ? "red" : "black",
            }}
          >
            {label}:{"\n"}ID: {result.user.id}
            {"\n"}Name: {result.user.name}
          </Text>
        );

      default:
        return (
          <Text style={{ marginTop: 10, color: "red" }}>
            Error: Unexpected server response
          </Text>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Users Demo</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="User name"
          value={form.userName}
          onChangeText={(text) => setForm({ ...form, userName: text })}
        />
        <Button title="Add User" onPress={addUser} />
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={form.userId}
          onChangeText={(text) => setForm({ ...form, userId: text })}
          keyboardType="numeric"
        />
        <Button title="Get User" onPress={getUser} />
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="User ID"
          value={form.userIdToDelete}
          onChangeText={(text) => setForm({ ...form, userIdToDelete: text })}
          keyboardType="numeric"
        />
        <Button title="Delete user" onPress={deleteUser} />
      </View>
      <Button title="Get All Users" onPress={getAllUsers} />
      {renderResult()}
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
