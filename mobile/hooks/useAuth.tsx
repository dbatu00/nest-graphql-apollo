/*
Overexplained in purpose to be used as a react reference
on vscode win:
To fold comments -> vscode command palette: >Fold All Block Comments
To unfold comments -> ctrl+k ctrl+j

Kind:
Hook (+ Context Provider)

Role:
Application authentication service

Responsibility:
- Own the application's authentication state
- Restore the session on startup
- Expose authentication state and actions via Context
- Distinguish invalid sessions from transient failures

Owns:
- Authentication session
  - current user
  - loading state

Delegates:
- Token persistence → utils/token
- Current user resolution → utils/currentUser → graphql/client
- Redirect behavior → AuthGate

Used by:
- AuthGate
- Login / signup / verification screens
- Any component requiring authentication state or session actions

Basic Flow:
App starts
      ↓
<AuthProvider> mounts
      ↓
refreshAuth()
      ↓
setUser()
      ↓
Context updates
      ↓
Consumers rerender

TODO: 
- Consider blocking authenticated route rendering in AuthGate until loading resolves to eliminate the cold-start flash
- Cold-start transient-failure gap: if getCurrentUser() fails on the very
  first refreshAuth() call (app launch), userRef.current is still null
  (no prior session in memory), so a valid stored token gets treated as
  "logged out" even though nothing about the session was actually invalid.
  Add a retry (e.g. on regaining network connectivity, or a bounded
  retry/backoff before giving up) instead of silently falling through to
  logged-out state on the very first failure.
*/

import {
  createContext, // Creates a Context object. Think of it as a globally accessible "slot"
  // that a Provider fills and consumers read.
  useContext,    // Reads the nearest Provider's value for a Context.
  useState,      // Creates component-owned state.
  useCallback,   // Memoizes (reuses) a function between renders unless dependencies change.
  useEffect,     // Runs after React renders. Used for side effects like network/storage.
  useMemo,       // Memoizes (reuses) a computed value between renders.
  useRef,        // Stores mutable data that survives rerenders but does NOT trigger rerenders.
  type ReactNode // Type representing anything React can render.
} from "react";

import { getCurrentUser } from "@/utils/currentUser";
import { clearToken, getToken, saveToken } from "@/utils/token";
import type { MeData } from "@/graphql/client";

//AuthUser is the shape this app uses internally to represent an authenticated user.
export type AuthUser = MeData;

//Shape shared by refreshAuth()'s backend result and setSession()'s caller-supplied user.
//Not exported — internal input contract for toAuthUser(), not a domain type.
type RawAuthUser = {
  id: number;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  email: string;
};

function toAuthUser(raw: RawAuthUser, emailVerified: boolean): AuthUser {
  return {
    id: raw.id,
    username: raw.username,
    displayName: raw.displayName,
    bio: raw.bio,
    avatarUrl: raw.avatarUrl,
    coverUrl: raw.coverUrl,
    email: raw.email,
    emailVerified,
  };
}

//Contract between AuthProvider and every useAuth() consumer.
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;

  setSession: (args: {
    token: string;
    user: RawAuthUser;
    emailVerified: boolean;
  }) => Promise<void>;

  logout: () => Promise<void>;
  refreshAuth: () => Promise<AuthUser | null>;
};

/*
undefined is the default value if someone tries to read this Context without an AuthProvider above them.
Later, useAuth() throws instead of allowing undefined.
*/
const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

/*
AuthProvider is a normal React component.
The only special thing about it is that it owns auth state and shares it with all descendant components.

"children" is whatever components are nested inside.
#example:
<AuthProvider>
    <App />
</AuthProvider>

<App /> becomes "children".

Syntax breakdown of the function signature:
function AuthProvider({ children }: { children: ReactNode }) { ... }
Every component receives exactly ONE argument: a single "props" object.
<AuthProvider foo="a" /> is really calling AuthProvider({ foo: "a" }).
So AuthProvider's real single argument here is: { children: <App /> }

{ children }          <- JS destructuring: pulls `children` out of the
                          incoming props object, so the body can just
                          write `children` instead of `props.children`.
: { children: ReactNode }  <- TS type annotation: describes the shape the
                          props object must have (must contain a
                          `children` field of type ReactNode).

These are two unrelated uses of curly braces sitting next to each other —
one is JS syntax (destructuring), the other is TS syntax (typing).

`children` is a special/conventional prop name. JSX automatically fills it
in from whatever is nested between a component's opening/closing tags —
nobody manually writes children={...}; nesting tags is sugar for it.
*/
export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  /*
  Creates state owned by THIS component.
  React remembers this state between renders.
  Calling setUser(...) schedules AuthProvider to rerender.
  */
  const [user, setUser] =
    useState<AuthUser | null>(null); // without the explicit generic, TS infers just `null` from the initial value, and setUser(realUser) would then error
  /*
  loading means:
  "Has startup authentication finished?"

  It starts true because the app has not yet determined whether
  an existing session can be restored.

  refreshAuth() is responsible for eventually setting it false.
  */
  const [loading, setLoading] =
    useState(true); // = useState<boolean>(true)

  /*
  Similar to state in that it survives rerenders.
  Unlike state:
  - changing it DOES NOT rerender
  - React ignores it during rendering
  Useful for storing mutable values async code needs.
  */
  const userRef =
    useRef<AuthUser | null>(null);

  /*
  useEffect()
  Runs AFTER React finishes rendering.
  Dependency array:
      [user]
  means:
  Run once after first render, then again every time "user" changes.
  */
  useEffect(() => {

    /* 
    Keep userRef pointing at the newest user.

    Async callbacks may outlive the render that created them.
    Reading userRef.current guarantees they see the latest user without recreating the callback. 
    */
    userRef.current = user;
  }, [user]);

  /*
useCallback()

Returns the SAME function object between renders unless one of its dependencies changes.
Why?
Normally every render creates a brand new function.
Sometimes that's fine.
Here we want refreshAuth to have a stable identity because:
- useEffect depends on it later
- Context exposes it to consumers
Dependency array:
    []
means this callback never needs to be recreated because it doesn't capture any changing values from React state.

(Notice we read user through userRef instead.)
*/
  const refreshAuth = useCallback(async () => {
    try {
      //check local storage
      const token = await getToken();
      if (!token) {
        setUser(null);
        return null;
      }

      /*
      ReturnType<typeof getCurrentUser> = "What does getCurrentUser() return?" = Promise<User | null>
      Awaited<...> = "What type do I get after await?" = User | null
      
      This saves us from manually writing the type and drift.
      */
      let currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
      try {
        //Validate the stored token by asking the backend who the current user is. 
        currentUser = await getCurrentUser();
      } catch (err: unknown) {
        /*
        err type is unknown because it is safer than "any".
        TypeScript forces us to inspect the value before assuming what it contains.

        getCurrentUser() converts authentication failures into null.
        Any error reaching this catch is therefore an unexpected/transient
        failure such as a network or server error.

        Keep the last known authenticated user rather than logging them out
        when authentication status cannot be determined.
        */

        console.warn("[useAuth] refreshAuth transient failure", err);

        /*
        Return the last known authenticated user and do not log the user out because of a temporary network/server problem.
         
        Because the dependency array is [], React creates this callback once and keeps reusing it for future renders.
        That means it doesn't automatically see updated state variables.
        Instead it reads userRef.current, whose value is updated after every render.
        */
        return userRef.current;
      }

      //backend responded and did not authenticate the user, clear token and logout(setuser(null))
      if (!currentUser) {
        await clearToken();
        setUser(null);
        return null;
      }

      //Convert the backend's user shape into the application'sAuthUser shape.
      const nextUser: AuthUser = toAuthUser(currentUser, currentUser.emailVerified);

      /*
      Update global auth state.
      This schedules AuthProvider to rerender.
      Every component using useAuth() will receive the updated Context value.
      */
      setUser(nextUser);
      return nextUser;
    } finally {

      // Startup authentication resolution is complete. The UI can stop showing loading indicators.
      setLoading(false);
    }
  }, []);

  //This effect runs once when AuthProvider mounts. It attempts to restore an existing session.
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  /*
  Called after a successful login or signup.
  1. Persists the token.
  2. Updates global auth state.
  */
  const setSession = useCallback(async (args: {
    token: string;
    user: RawAuthUser;
    emailVerified: boolean;
  }) => {
    await saveToken(args.token);
    setUser(toAuthUser(args.user, args.emailVerified));
  }, []);

  /*
  Clears the local authenticated session.
  - Removes stored token.
  - Clears global auth state.
  It intentionally does NOT decide where the app should navigate afterwards.
  Instead, the routing layer (AuthGate) should observe user becoming null and redirect appropriately.
  */
  const logout = useCallback(async () => {
    //Remove the persisted token so that the next app launch will therefore begin unauthenticated.  
    await clearToken();

    /*
    Clear the application's source of truth.
    This schedules AuthProvider to rerender.
    Every component using useAuth() will immediately see:
        user === null
    */
    setUser(null);

  }, []);

  /*
  Similar idea to useCallback.
  useCallback memoizes FUNCTIONS.
  useMemo memoizes VALUES.
  Without useMemo, every render would create a brand new object:
      {
          user,
          loading,
          ...
      }

  
 /*
  useMemo memoizes values (whereas useCallback memoizes functions).

  <AuthContext.Provider> compares its value by object identity, not by contents.
  Without useMemo, every AuthProvider render would create a new value object, causing every useAuth() consumer to rerender even if nothing in the authentication state actually changed.

  This object is recomputed only when one of its dependencies changes:
  - user changes whenever setUser(...) is called (login, logout, refreshAuth, etc.).
  - loading changes when startup authentication begins/finishes.
  - setSession, logout, and refreshAuth never change because they are memoized with useCallback([]).

  In practice, this object almost always changes due to user or loading being changed.
  */
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    setSession,
    logout,
    refreshAuth,
  }), [
    user,
    loading,
    setSession,
    logout,
    refreshAuth,
  ]);

  //This is where the Context actually receives its value.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/*
Custom Hook.
This is a convenience wrapper around useContext().
Instead of every component writing:
    const auth = useContext(AuthContext);
they simply write:
    const auth = useAuth();
This also centralizes safety checks.
*/
export function useAuth() {

  /*
  Read the nearest AuthContext.Provider above this
  component in the React tree.

  React automatically walks upward until it finds one.
  */
  const context = useContext(AuthContext);

  /*
  Defensive programming.

  If someone forgets to wrap the app in AuthProvider,
  context would otherwise be undefined and fail much
  later with confusing errors.

  Throwing here makes the mistake obvious.
  */
  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  /*
  Return the application's authentication API.

  Consumers typically write:

      const {
          user,
          logout,
          loading,
      } = useAuth();

  They are NOT creating auth state.

  They are receiving the single shared auth state owned
  by AuthProvider.

  They then can use context like:
  const { user, logout } = useAuth();
  const isOwnProfile = user?.username === username;
  */
  return context;
}

/*
Mental model:

AuthProvider owns authentication.

AuthContext transports authentication.

useAuth() reads authentication.

Screens react to authentication.

Nothing else owns user state.
*/