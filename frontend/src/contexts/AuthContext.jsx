// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/auth";
import { api, setAuthToken } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== helper: lưu token + user vào state + localStorage =====
  const persistAuth = (data, fallbackUser) => {
    const token = data?.token;
    const userData = data?.user || fallbackUser || null;

    if (token) {
      localStorage.setItem("token", token);
      setAuthToken(token);
    } else {
      localStorage.removeItem("token");
      setAuthToken(null);
    }

    if (userData) {
      try {
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (e) {
      }
    } else {
      localStorage.removeItem("user");
    }

    setUser(userData);
    return userData;
  };

  // ===== login bằng token (dùng cho Google callback, reload, v.v.) =====
  const loginWithToken = async (token) => {
    if (!token) return;

    localStorage.setItem("token", token);
    setAuthToken(token);

    try {
      const me = await api.get("/api/auth/me");
      const meData = me?.data || me;
      persistAuth({ token, user: meData }, meData);
      return meData;
    } catch (err) {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setAuthToken(null);
      throw err;
    }
  };

  // ===== Lấy user + token từ localStorage khi app load =====
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const savedToken = localStorage.getItem("token");
        const savedUserStr = localStorage.getItem("user");

        if (savedToken) {
          // Có token thì ưu tiên gọi /me để lấy full profile (có wishlist, addresses,...)
          try {
            await loginWithToken(savedToken);
            if (cancelled) return;
          } catch (e) {
            // nếu token hỏng thì fallback về user đã lưu (nếu có), rồi xoá token
            if (savedUserStr) {
              try {
                const parsed = JSON.parse(savedUserStr);
                if (!cancelled) setUser(parsed);
              } catch {
                if (!cancelled) setUser(null);
              }
            } else {
              if (!cancelled) setUser(null);
            }
          }
        } else if (savedUserStr) {
          // Không có token nhưng có user (trường hợp fake) → dùng tạm
          try {
            const parsed = JSON.parse(savedUserStr);
            if (!cancelled) setUser(parsed);
          } catch {
            if (!cancelled) setUser(null);
          }
        } else {
          if (!cancelled) setUser(null);
        }
      } catch (e) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===== login / register =====
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      const token = data?.token;
      const userData = data?.user;

      // Nếu backend chỉ trả token → gọi /me để lấy full user (có wishlist)
      if (token && !userData) {
        const meData = await loginWithToken(token);
        return meData;
        await loginWithToken(token);
      }

      const finalUserData = persistAuth(data, { email });
      return finalUserData || userData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
  // payload có thể là { name, email, password, sendPasswordEmail, ... }
  setLoading(true);
  try {
    const data = await authService.register(payload);
    const token = data?.token;
    const userData = data?.user;

    if (token && !userData) {
      await loginWithToken(token);
      return;
    }

    const { name, email } = payload || {};
    return persistAuth(data, { name, email });
  } finally {
    setLoading(false);
  }
};


  const logout = () => {
    try {
      authService.logout && authService.logout();
    } catch (e) {
    }

    // clear luôn localStorage + axios header
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
  };

  // cho AccountPage dùng để sync user mới sau khi updateProfile
  const updateUser = (nextUser) => {
    setUser(nextUser);
    try {
      if (nextUser) {
        localStorage.setItem("user", JSON.stringify(nextUser));
      } else {
        localStorage.removeItem("user");
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        loginWithToken,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      updateUser: () => {},
      loginWithToken: async () => {},
    };
  }
  return ctx;
}
