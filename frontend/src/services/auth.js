// src/services/auth.js
const API_URL = process.env.REACT_APP_API_URL || '';

async function http(path, options = {}) {
  const url = API_URL ? `${API_URL}${path}` : path;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function login(payload) {
  return http('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
//  B1: Nhập email -> phát OTP
export async function forgotPasswordRequest(email) {
  return http('/api/auth/forgot-password/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

//  B2: Nhập OTP + mật khẩu mới
export async function forgotPasswordVerify({ email, otp, newPassword }) {
  return http('/api/auth/forgot-password/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword }),
  });
}
export async function register(payload) {
  return http('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
