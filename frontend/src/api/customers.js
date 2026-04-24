import { apiClient } from './client';

/**
 * @typedef {Object} FetchCustomersParams
 * @property {string=} q
 * @property {number=} page
 * @property {number=} limit
 */

/**
 * @param {FetchCustomersParams=} opts
 */
export function fetchCustomers(opts = {}) {
  const {
    q,
    page = 1,
    limit = 20,
    status,
    country,
    joinStart,
    joinEnd,
    ordersMin,
    ordersMax,
  } = opts;
  return apiClient.get('/customers', {
    params: {
      q,
      page,
      limit,
      status,
      country,
      joinStart,
      joinEnd,
      ordersMin,
      ordersMax,
    },
  });
}

export function fetchCustomerById(idOrEmail) {
  return apiClient.get(`/customers/${encodeURIComponent(idOrEmail)}`);
}

export function fetchCustomerOrders(id, { page = 1, limit = 20 } = {}) {
  return apiClient.get(`/customers/${encodeURIComponent(id)}/orders`, { params: { page, limit } });
}

export function createCustomer(customerData) {
  return apiClient.post('/customers', customerData);
}

export function updateCustomer(idOrEmail, customerData) {
  return apiClient.patch(`/customers/${encodeURIComponent(idOrEmail)}`, customerData);
}

export function deleteCustomer(idOrEmail) {
  return apiClient.delete(`/customers/${encodeURIComponent(idOrEmail)}`);
}

/**
 * Get new users count (users created in the last N days, excluding admin)
 * @param {number} days - Number of days (default: 7)
 */
export function fetchNewUsersCount(days = 7) {
  return apiClient.get('/customers/stats/new-users', {
    params: { days },
  });
}

export default {
  fetchCustomers,
  fetchCustomerById,
  fetchCustomerOrders,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchNewUsersCount,
};


