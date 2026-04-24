import { apiClient } from './client';

export const ProductsApi = {
  list: async (params) => {
    const res = await apiClient.get('/products', { headers: {}, ...(params ? { params } : {}) });
    if (res.success) {
      console.log("🗄️ [Repository Pattern] Product list managed and fetched via ProductRepository");
    }
    return res;
  },
  get: (id) => apiClient.get(`/products/${id}`),
  getDefaults: (category) => apiClient.get('/products/defaults', { params: { category } }),
  create: (payload) => apiClient.post('/products', payload),
  update: (id, payload) => apiClient.put(`/products/${id}`, payload),
  remove: (id) => apiClient.delete(`/products/${id}`),
};

export default ProductsApi;



