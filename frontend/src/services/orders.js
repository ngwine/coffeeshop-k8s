import { http } from './api';

export function createOrder({ items, address }, token) {
  return http('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ items, address }),
    token
  });
}

export function myOrders(token) {
  return http('/api/orders/me', { token });
}
