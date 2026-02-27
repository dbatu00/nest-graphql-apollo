import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getCurrentUser } from "@/utils/currentUser";
import { clearToken, getEmailVerified, getToken, saveEmailVerified, saveToken } from "@/utils/token";

export type AuthUser = {
  id: number;
  username: string;
  displayName?: string;
  emailVerified: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setSession: (args: {
    token: string;
    user: {
      id: number;
      username: string;
      displayName?: string;
    };
    emailVerified: boolean;
  }) => Promise<void>;
  setEmailVerified: (value: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refreshAuth = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        return null;
      }

      let currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
      try {
        currentUser = await getCurrentUser();
      } catch (err: unknown) {
        console.warn("[useAuth] refreshAuth transient failure", err);
        return userRef.current;
      }

      if (!currentUser) {
        await clearToken();
        setUser(null);
        return null;
      }

      const persistedEmailVerified = await getEmailVerified();
      const resolvedEmailVerified =
        typeof currentUser.emailVerified === "boolean"
          ? currentUser.emailVerified
          : (persistedEmailVerified ?? false);

      await saveEmailVerified(resolvedEmailVerified);

      const nextUser: AuthUser = {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        emailVerified: resolvedEmailVerified,
      };

      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const setSession = useCallback(async (args: {
    token: string;
    user: {
      id: number;
      username: string;
      displayName?: string;
    };
    emailVerified: boolean;
  }) => {
    await saveToken(args.token);
    await saveEmailVerified(args.emailVerified);

    setUser({
      id: args.user.id,
      username: args.user.username,
      displayName: args.user.displayName,
      emailVerified: args.emailVerified,
    });
  }, []);

  const setEmailVerified = useCallback(async (value: boolean) => {
    await saveEmailVerified(value);
    setUser((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        emailVerified: value,
      };
    });
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    setSession,
    setEmailVerified,
    logout,
    refreshAuth,
  }), [user, loading, setSession, setEmailVerified, logout, refreshAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
