// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // key theo từng user
  const storageKey = useMemo(() => {
    if (!user) return "notifications:guest";
    const id = user.id || user._id || user.email || user.username || "user";
    return `notifications:${String(id)}`;
  }, [user]);

  // load lịch sử khi user / key thay đổi
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
          return;
        }
      }
    } catch (err) {
      console.error("[Notifications] load failed:", err);
    }
    setNotifications([]); // nếu không có gì
  }, [storageKey]);

  // save + tính unread
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (err) {
      console.error("[Notifications] save failed:", err);
    }
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications, storageKey]);

  const addNotification = (payload) => {
    setNotifications((prev) => [
      {
        id:
          payload.id ||
          Date.now().toString(36) + Math.random().toString(36).slice(2),
        title: payload.title || "Notification",
        message: payload.message || "",
        description: payload.description || "",
        type: payload.type || "info",
        createdAt: payload.createdAt || new Date().toISOString(),
        read: false,
      },
      ...prev, // mới nhất lên đầu
    ]);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAllRead,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
};
