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

  const getAllUsers = async () => {
    const query = `
      query {
        getUsers {
          id
          name
        }
      }
    `;

    console.log("getAllUsers called");

    try {
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      console.log("getAllUsers response:", data);

      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        alert("Failed to fetch users");
        return;
      }

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

    console.log("getUser called with id:", userId);

    //{getUser: { id: number; name: string } | null} this is what graphql will return, hence the  <{type declaration}>
    //this is so that react client and graphql can shake on data structure
    //there are ways to avoid typing graphql objects by hand with libraries frameworks etc
    try {
      const result = await graphqlFetch<{
        getUser: { id: number; name: string } | null;
      }>(query, { id: Number(userId) });

      console.log("getUser response:", result.getUser);
      setResult(result.getUser);
    } catch (err) {
      console.error("getUser failed:", err);
      setResult({ error: String(err) });
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
    console.log("addUser called with userName:", userName);

    // Validate input: user name cannot contain digits
    if (/\d/.test(userName)) {
      alert("User name cannot contain digits.");
      return;
    }

    const mutation = `
    mutation($input: AddUserInput!) {
      addUser(addUserInput: $input) {
        user {
          id
          name
        }
        userExists
      }
    }
  `;

    try {
      let result = await graphqlFetch<{
        addUser: { user?: { id: number; name: string }; userExists?: boolean };
      }>(mutation, { input: { name: userName } });

      console.log("addUser first attempt response:", result);

      if (result.addUser.user) {
        // User creation successful
        console.log("User created successfully:", result.addUser.user);
        setResult(result.addUser.user);
      } else if (result.addUser.userExists) {
        // User already exists
        console.log("User already exists:", result.addUser.userExists);
        const confirmForce = window.confirm("User already exists. Overwrite?");
        if (confirmForce) {
          // Overwrite existing user
          result = await graphqlFetch(mutation, {
            input: { name: userName, force: true },
          });
          console.log("addUser second attempt (force=true) response:", result);
          setResult(result.addUser.user!);
        } else {
          // User cancelled overwrite
          setResult({ error: "User creation cancelled." });
          console.log("User creation cancelled by client");
        }
      }
    } catch (err) {
      console.error("addUser failed:", err);
      setResult({ error: String(err) });
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

    console.log("deleteUser called with id:", userIdToDelete);

    try {
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
    } catch (err) {
      console.error("deleteUser failed:", err);
      setResult({ error: String(err) });
    }
  };

  const renderResult = () => {
    console.log("rendering");
    if (Array.isArray(result)) {
      // ✅ Case 1: List of users (getAllUsers)
      return (
        <FlatList
          data={result}
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
    }

    if (!result) {
      // ✅ Case 6: null / undefined
      return (
        <Text style={{ marginTop: 10, color: "red" }}>User not found</Text>
      );
    }

    if (result.error) {
      // ✅ Case 2: error object
      return (
        <Text style={{ marginTop: 10, color: "red" }}>{result.error}</Text>
      );
    }

    if (result.affected !== undefined) {
      // ✅ Case 3: deleteUser response
      return (
        <Text style={{ marginTop: 10, color: "red" }}>
          Deleted:
          {"\n"}ID: {result.id}
          {"\n"}Name: {result.name}
          {"\n"}Rows affected: {result.affected}
        </Text>
      );
    }

    if (result.id && result.name) {
      // ✅ Case 4: getUser or addUser (no force, user does not exist)
      return (
        <Text style={{ marginTop: 10 }}>
          ID: {result.id}
          {"\n"}Name: {result.name}
        </Text>
      );
    }

    if (result && result.user) {
      // ✅ Case: addUser created a new user
      return (
        <Text style={{ marginTop: 10 }}>
          ID: {result.user.id}
          {"\n"}Name: {result.user.name}
        </Text>
      );
    }

    // ✅ Case 5: unexpected object
    return (
      <Text style={{ marginTop: 10, color: "red" }}>
        Error: Unexpected server response
      </Text>
    );
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
