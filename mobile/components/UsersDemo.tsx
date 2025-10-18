import React, { useState } from "react";
import {
  View,
  Button,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
} from "react-native";

const GRAPHQL_URL = "http://192.168.1.2:3000/graphql";

export default function UsersDemo() {
  const [form, setForm] = useState({
    userIdsStringForDeleteUsers: "",
    userName: "",
    userIdsStringForGetUsers: "",
  });

  type Result =
    | { type: "idle" }
    | { type: "error"; message: string }    
    | { type: "addedUser"; user: { id: number; name: string } }
    | { type: "getUsers"; users: { id: number; name: string }[] }
    | { type: "deletedUsers"; users: { id: number; name: string }[] };

  const [result, setResult] = useState<Result>({ type: "idle" });

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
      throw new Error(data.errors[0]?.message || "GraphQL request failed");
    }

    return data.data as T;
  }

 const getUsers = async () => 
  {
    const entries = form.userIdsStringForGetUsers
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    if (entries.length === 0) {
      // No input → fetch all users
      const query = `query { getAllUsers { id name } }`;
      try {
        const data = await graphqlFetch<{ getAllUsers: { id: number; name: string }[] }>(query);
        setResult({ type: "getUsers", users: data.getAllUsers });
      } catch (err) {
        setResult({ type: "error", message: String(err) });
      }
      return;
  }

  const allNumbers = entries.every((s) => /^\d+$/.test(s));
  const allStrings = entries.every((s) => /^[A-Za-z][A-Za-z0-9]*$/.test(s));

  if (!allNumbers && !allStrings) {
    alert("Enter either all numbers (IDs) or all valid names, separated by commas.");
    return;
  }

  if (allNumbers) {
    // Query by IDs
    const userIds: number[] = entries.map(Number);
    const query = `query($ids: [Int!]!) { findUsersById(ids: $ids) { id name } }`;
    const variables = { ids: userIds };

    try {
      const data = await graphqlFetch<{ findUsersById: { id: number; name: string }[] }>(
        query,
        variables
      );
      setResult({ type: "getUsers", users: data.findUsersById });
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  } else if (allStrings) {
    // Query by Names
    const query = `query($names: [String!]!) { findUsersByName(names: $names) { id name } }`;
    const variables = { names: entries };

    try {
      const data = await graphqlFetch<{ findUsersByName: { id: number; name: string }[] }>(
        query,
        variables
      );
      setResult({ type: "getUsers", users: data.findUsersByName });
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  }
};



  const addUser = async () => {
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
        setResult({ type: "addedUser", user: data.addUser.user });
      } else if (data.addUser.userExists) {
        const confirmForce = window.confirm("User already exists. Overwrite?");
        if (confirmForce) {
          data = await graphqlFetch(mutation, {
            input: { name: form.userName, force: true },
          });
          setResult({ type: "addedUser", user: data.addUser.user! });
        } else {
          setResult({ type: "error", message: "User creation cancelled." });
        }
      }
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  const deleteUser = async () => {
  const userIdsStringForDeleteUsers = form.userIdsStringForDeleteUsers
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (userIdsStringForDeleteUsers.length === 0) {
    alert("Please enter at least one user ID to delete.");
    return;
  }

  const allValid = userIdsStringForDeleteUsers.every((s) => /^\d+$/.test(s));
  if (!allValid) {
    alert("User IDs must be numbers.");
    return;
  }

  const userIds: number[] = userIdsStringForDeleteUsers.map(Number);

  const mutation = `mutation($ids: [Int!]!) { deleteUser(ids: $ids) { id name } }`;
  const variables = { ids: userIds };

  try {
    const data = await graphqlFetch<{ deleteUser: { id: number; name: string }[] }>(
      mutation,
      variables
    );
    setResult({ type: "deletedUsers", users: data.deleteUser });
  } catch (err) {
    setResult({ type: "error", message: String(err) });
  }
};


  const renderResult = () => {
    if (result.type === "idle") return null;

    let usersToRender: { id: number; name: string; hue: string }[] = [];

    switch (result.type) {
      case "error":
        return (
          <Text style={{ marginTop: 10, color: "red" }}>{result.message}</Text>
        );

      case "getUsers":
        usersToRender = result.users.map((u) => ({
          ...u,
          hue: u.name === "User not found" ? "red" : "#f0f0f0",
        }));
        break;

      case "addedUser":
        usersToRender = [{ ...result.user, hue: "green" }];
        break;

      case "deletedUsers":
        usersToRender = result.users.map((u) => ({
          ...u,
          hue: u.name.startsWith("Deleted")
            ? "orange"
            : u.name === "User not found"
            ? "red"
            : "#f0f0f0",
        }));
        break;

      default:
        return (
          <Text style={{ marginTop: 10, color: "red" }}>
            Unexpected server response
          </Text>
        );
    }

    return (
      <FlatList
        data={usersToRender}
        keyExtractor={(item) => item.id.toString()}
        numColumns={5}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
        contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: item.hue }]}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardId}>ID: {item.id}</Text>
          </View>
        )}
      />
    );
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
          placeholder="User IDs (comma separated)"
          value={form.userIdsStringForDeleteUsers}
          onChangeText={(text) =>
            setForm({ ...form, userIdsStringForDeleteUsers: text })
          }
        />
        <Button title="Delete Users" onPress={deleteUser} />
      </View>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="User IDs or names (comma separated or empty for all users)"
          value={form.userIdsStringForGetUsers}
          onChangeText={(text) => setForm({ ...form, userIdsStringForGetUsers: text })}
        />
        <Button title="Get Users" onPress={getUsers} />
      </View>

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
