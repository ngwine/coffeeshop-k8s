// src/lib/client.js
// Minimal fetch wrapper for frontend API calls
// - Base URL từ biến môi trường CRA
// - JSON by default
// - Basic error handling và timeout support

const API_BASE_URL = 'http://localhost:3001/api';


const DEFAULT_TIMEOUT_MS = 15000;

function buildUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function applyQuery(url, params) {
  if (!params) return url;
  const u = new URL(url);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((item) => u.searchParams.append(k, String(item)));
    else u.searchParams.set(k, String(v));
  });
  return u.toString();
}

let authTokenProvider = null; // optional callback để lấy token
export function setAuthTokenProvider(fn) {
  authTokenProvider = fn;
}

async function request(
  path,
  {
    method = 'GET',
    headers,
    body,
    params,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const finalSignal = signal ?? controller.signal;

  // Lấy token: ưu tiên authTokenProvider, fallback localStorage cho code cũ
  let authHeader = null;
  if (authTokenProvider) {
    authHeader = await authTokenProvider();
  } else if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) authHeader = `Bearer ${token}`;
  }

  try {
    const urlWithQuery = params ? applyQuery(buildUrl(path), params) : buildUrl(path);

    const res = await fetch(urlWithQuery, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !(body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(authHeader
          ? {
              Authorization:
                typeof authHeader === 'string'
                  ? authHeader
                  : `Bearer ${authHeader.token || authHeader}`,
            }
          : {}),
        ...headers,
      },
      body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
      signal: finalSignal,
      credentials: 'include', // giữ behaviour cũ
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const error = new Error((data && data.message) || `HTTP ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  get: (path, options) => request(path, { method: 'GET', ...(options || {}) }),
  post: (path, body, options) => request(path, { method: 'POST', body, ...(options || {}) }),
  put: (path, body, options) => request(path, { method: 'PUT', body, ...(options || {}) }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body, ...(options || {}) }),
  delete: (path, options) =>
    request(path, { method: 'DELETE', ...(options || {}) }),
};

export default apiClient;

// Backwards-compatible helper cho code cũ đang dùng apiGet
export async function apiGet(path, params = {}, { signal } = {}) {
  return apiClient.get(path, { params, signal });
}
