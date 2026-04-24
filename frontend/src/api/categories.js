import { apiClient } from './client';

export const CategoriesApi = {
  list: (params = {}) => apiClient.get('/categories', { params }),
  get: (id) => apiClient.get(`/categories/${id}`),
  create: (payload) => apiClient.post('/categories', payload),
  update: (name, payload) => apiClient.patch(`/categories/${encodeURIComponent(name)}`, payload),
  remove: (name) => apiClient.delete(`/categories/${encodeURIComponent(name)}`),
};

export default CategoriesApi;




