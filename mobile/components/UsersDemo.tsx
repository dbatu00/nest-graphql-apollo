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
    userIdToDelete: "",
    userName: "",
    userIdsString: "", // raw input
  });

  type Result =
    | { type: "idle" }
    | { type: "error"; message: string }
    | { type: "findUsers"; users: { id: number; name: string }[] }
    | { type: "added"; user: { id: number; name: string } }
    | { type: "deleted"; user: { id: number; name: string} []  };

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




  //if no input is given, sends an empty number array which returns all users
  const getUsers = async () => {

    const userIdsStrings = form.userIdsString
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0); // remove empty entries

      // Check that every entry is a valid number
      const allValid = userIdsStrings.every((s) => /^\d+$/.test(s));

    if (!allValid) {
      alert("User IDs must be numbers.");
      return;
    }

    // Convert to number array
    const userIds: number[] = userIdsStrings.map(Number);

    const query = `query($ids: [Int!]!) { findUsers(ids: $ids) { id name } }`;
    const variables = {ids: userIds.map((id) => Number(id))};// ensure Int[]

    try 
    {
      const data = await graphqlFetch
      <{findUsers: { id: number; name: string }[]}>
      (query, variables);

      setResult({ type: "findUsers", users: data.findUsers });

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
        <Text style={{ marginTop: 10, color: "red" }}>
          {result.message}
        </Text>
      );

    case "findUsers":
      if (result.users.length === 0) {
        return (
          <Text style={{ marginTop: 10, color: "red" }}>
            User not found.
          </Text>
        );
      }

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

    case "added":
      if (!result.user) {
        return (
          <Text style={{ marginTop: 10, color: "red" }}>
            User not found.
          </Text>
        );
      }

      return (
        <Text style={{ marginTop: 10, color: "black" }}>
          Added:{"\n"}ID: {result.user.id}{"\n"}Name: {result.user.name}
        </Text>
      );

    case "deleted":
      if (!result.user || !result.user.name) {
        return (
          <Text style={{ marginTop: 10, color: "red" }}>
            User not found.
          </Text>
        );
      }

      return (
        <Text style={{ marginTop: 10, color: "red" }}>
          Deleted:{"\n"}ID: {result.user.id}{"\n"}Name: {result.user.name}
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
          value={form.userIdToDelete}
          onChangeText={(text) => setForm({ ...form, userIdToDelete: text })}
          keyboardType="numeric"
        />
        <Button title="Delete user" onPress={deleteUser} />
      </View>
      
      
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="User IDs (comma separated or empty for all users)"
          value={form.userIdsString}
          onChangeText={(text) => setForm({ ...form, userIdsString: text })}
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
