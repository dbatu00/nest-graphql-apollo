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
import { parseQuery } from "@/utils/parseQuery";
import { graphqlFetch } from "@/utils/graphqlFetch";
import { mapResultToCards, Result, Card } from "@/utils/mapUserResultsToCards";
import { validateUserName } from "@/utils/validateUserName";
import { commonStyles as styles} from "@/styles/common";

export default function Users() {
  const [form, setForm] = useState({
    userName: "",
    userIdsStringForGetUsers: "",
    userIdsStringForDeleteUsers: "",
  });

  const [result, setResult] = useState<Result>({ type: "idle" });

  // --- Handlers ---
  const getUsers = async () => {
    const entries = parseQuery(form.userIdsStringForGetUsers);

    // No input → fetch all
    if (entries.ids.length === 0 && entries.names.length === 0) {
      try {
        const data = await graphqlFetch<{ getAllUsers: { id: number; name: string }[] }>(
          `query { getAllUsers { id name } }`
        );
        setResult({ type: "getUsers", users: data.getAllUsers });
      } catch (err) {
        setResult({ type: "error", message: String(err) });
      }
      return;
    }

    // Mixed IDs & Names → invalid
    if (entries.ids.length !== 0 && entries.names.length !== 0) {
      alert("Enter either all numbers (IDs) or all valid names, separated by commas.");
      return;
    }

    // Names cannot start with a number
    if (!entries.names.every((name) => /^[^\d]/.test(name))) {
      alert("User names cannot start with a digit.");
      return;
    }

    try {
      if (entries.ids.length !== 0) {
        const query = `query($ids: [Int!]!) { findUsersByIds(ids: $ids) { id name } }`;
        const data = await graphqlFetch<{ findUsersByIds: { id: number; name: string }[] }>(
          query,
          { ids: entries.ids.map(Number) }
        );
        setResult({ type: "getUsers", users: data.findUsersByIds });
      } else {
        const query = `query($names: [String!]!) { findUsersByNames(names: $names) { id name } }`;
        const data = await graphqlFetch<{ findUsersByNames: { id: number; name: string }[] }>(
          query,
          { names: entries.names }
        );
        setResult({ type: "getUsers", users: data.findUsersByNames });
      }
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  const addUser = async () => {
    if (!validateUserName(form.userName)) {
      alert("User name must start with a letter and can only contain letters or digits.");
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
      let data = await graphqlFetch<{ addUser: { user?: { id: number; name: string }; userExists?: boolean } }>(
        mutation,
        { input: { name: form.userName } }
      );

      if (data.addUser.user) {
        setResult({ type: "addedUser", user: data.addUser.user });
      } else if (data.addUser.userExists) {
        const confirmForce = window.confirm("User already exists. Overwrite?");
        if (confirmForce) {
          data = await graphqlFetch(mutation, { input: { name: form.userName, force: true } });
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
    const { ids, names } = parseQuery(form.userIdsStringForDeleteUsers);

    if (names.length !== 0) {
      alert("Please only enter numerical values for deletion.");
      return;
    }
    if (ids.length === 0) {
      alert("Please enter at least one user ID to delete.");
      return;
    }

    try {
      const mutation = `mutation($ids: [Int!]!) { deleteUser(ids: $ids) { id name } }`;
      const data = await graphqlFetch<{ deleteUser: { id: number; name: string }[] }>(
        mutation,
        { ids }
      );
      setResult({ type: "deletedUsers", users: data.deleteUser });
    } catch (err) {
      setResult({ type: "error", message: String(err) });
    }
  };

  // --- Render ---
  const renderResult = () => {
    if (result.type === "error") {
      return <Text style={{ marginTop: 10, color: "red" }}>{result.message}</Text>;
    }

    const usersToRender: Card[] = mapResultToCards(result);

    if (usersToRender.length === 0) return null;

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
      <Text style={styles.title}>Users</Text>

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
          onChangeText={(text) => setForm({ ...form, userIdsStringForDeleteUsers: text })}
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


