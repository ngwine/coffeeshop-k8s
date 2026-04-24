import { apiClient } from './client';

export function fetchOrders(params = {}) {
  const {
    q,
    status,
    email,
    page = 1,
    limit = 20,        // 👈 default 20 (hoặc 50 tuỳ em)
    includeItems = true,
    range,
    startDate,
    endDate,
  } = params;

  const requestParams = { q, status, email, page, limit, includeItems };
  
  // Add date range parameters if provided
  if (range) {
    requestParams.range = range;
  }
  if (startDate) {
    requestParams.startDate = startDate;
  }
  if (endDate) {
    requestParams.endDate = endDate;
  }

  return apiClient.get('/orders', {
    params: requestParams,
  });
}

export function fetchOrderById(id) {
  return apiClient.get(`/orders/${encodeURIComponent(id)}`);
}

export const OrdersApi = {
  // dùng chung 1 logic
  list: (params = {}) => fetchOrders(params),
  get: (id) => fetchOrderById(id),
  create: (payload) => apiClient.post('/orders', payload),
  updateStatus: (id, status, additionalData = {}) => {
    const payload = { status, ...additionalData };
    return apiClient.patch(`/orders/${encodeURIComponent(id)}`, payload);
  },
  update: (id, data) => apiClient.patch(`/orders/${encodeURIComponent(id)}`, data),
};

export default OrdersApi;
