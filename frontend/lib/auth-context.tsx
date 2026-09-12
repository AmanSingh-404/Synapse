"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setAccessToken } from "./api";

type AuthContextType = {
  userId: string | null;
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEmail(localStorage.getItem("synapse_email"));
    // On mount, try to silently refresh using the httpOnly cookie
    api
      .refresh()
      .then(() => api.me())
      .then((data) => setUserId(data.user_id))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    const me = await api.me();
    setUserId(me.user_id);
    setEmail(email);
    localStorage.setItem("synapse_email", email);
  };

  const logout = async () => {
    await api.logout();
    setUserId(null);
    setEmail(null);
    localStorage.removeItem("synapse_email");
  };

  return (
    <AuthContext.Provider value={{ userId, email, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}