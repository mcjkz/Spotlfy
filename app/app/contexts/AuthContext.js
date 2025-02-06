"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const fetchSessionAndUser = async () => {
    try {
      setIsAuthLoading(true);
      const sessionResponse = await fetch("/api/session", { credentials: "include" });

      if (!sessionResponse.ok) {
        setUserData(null);
        return;
      }

      const sessionData = await sessionResponse.json();

      const usersResponse = await fetch("/api/users");
      if (!usersResponse.ok) {
        setUserData(null);
        return;
      }

      const users = await usersResponse.json();
      const user = users.find((u) => u.email === sessionData.email);

      setUserData(user || null);
    } catch (error) {
      setUserData(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndUser();
  }, []);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setUserData(null);
    setIsAuthLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    fetchSessionAndUser();
  };

  return (
    <AuthContext.Provider value={{ userData, isAuthLoading, fetchSessionAndUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
