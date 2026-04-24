import { apiClient } from './client';

export const AuthApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (payload) => apiClient.post('/auth/register', payload),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

export default AuthApi;



