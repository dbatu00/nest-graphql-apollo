import { useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TEMP: simulate async auth check
    setTimeout(() => {
      setUser(null); // not logged in
      setLoading(false);
    }, 100);
  }, []);

  return {
    user,
    loading,
    login: (u: User) => setUser(u),
    logout: () => setUser(null),
  };
}
