import { api } from '../lib/api';

export function applyVoucher(code, items) {
  return api.post('/api/vouchers/apply', { code, items }).then(r => r.data);
}
