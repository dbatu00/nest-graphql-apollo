# User CRUD Practice Project

A simple website for performing **CRUD operations** on user entities.  
Each user has a **name** and a **unique ID**.

---

## 🧩 Features

### 🟢 Get Users
Retrieves user information based on input.

**Input options:**
- **Usernames:** Comma-separated strings (e.g. `alice,bob`)
  - If multiple users share a name → returns all.
  - If a username has no match → returns the name with an error message.
- **User IDs:** Comma-separated numeric IDs (e.g. `1,2,3`)
  - If an ID has no match → returns the ID with an error message.
- **No input:** Returns **all users** in the database.

> ⚠️ If there is input, it must be **all strings or all IDs** — no mixing.

---

### 🟡 Add User
Adds a new user to the database.

- Takes a **username** as input.
- If a user with the same name already exists:
  - The client asks whether to **create a duplicate** with a unique ID.

---

### 🔴 Delete Users
Deletes users by ID.

- Input: Comma-separated user IDs (e.g. `2,5,9`)
- Returns:
  - A **success message** with deleted user info, or  
  - A **“user not found”** message with the given IDs.

---

## 🚀 Running the Project

At the project root directory:

```bash
npm run dev
