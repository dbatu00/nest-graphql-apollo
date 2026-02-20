import { useState, useEffect } from "react";

type User = {
  id: number;
  username: string;
  displayName?: string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Temporary async auth simulation until token-backed auth state is unified.
    const timeoutId = setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return {
    user,
    loading,
    login: (u: User) => setUser(u),
    logout: () => setUser(null),
  };
}
