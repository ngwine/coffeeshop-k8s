// src/services/account.js
import { api } from "../lib/api";

export async function updateProfile(payload) {
  const res = await api.put("/api/account/profile", payload);
  return res.data;
}

export async function changePassword(payload) {
  const res = await api.post("/api/auth/change-password", payload);
  return res.data;
}
