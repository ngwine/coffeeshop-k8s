import React, { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { formatVND } from '../../../../../../utils/currency';
import Card from '../common/Card';

const PopularProducts: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const { OrdersApi } = await import('../../../../../../api/orders');
        const res = await OrdersApi.list({ page: 1, limit: 100, includeItems: 'true' });
        const orders = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.items)
            ? res.items
            : [];

        if (cancelled) {
          return;
        }

        const agg = new Map<
          string,
          { name: string; sku?: string; qty: number; revenue: number }
        >();

        for (const order of orders) {
          const list = Array.isArray(order.items) ? order.items : [];
          for (const item of list) {
            const key = String(item.productId || item.sku || item.name || '').toLowerCase();
            if (!key) continue;

            const prev = agg.get(key) || {
              name: item.name || item.sku || 'Item',
              sku: item.sku,
              qty: 0,
              revenue: 0,
            };
            prev.qty += Number(item.quantity || item.qty || 1);
            prev.revenue += Number(item.price || 0) * Number(item.quantity || item.qty || 1);
            agg.set(key, prev);
          }
        }

        const top = Array.from(agg.values())
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 6);

        setItems(top);
      } catch (e) {
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Popular Products</h3>
          <p className="text-sm text-text-secondary">Top theo số lượng bán</p>
        </div>
        <MoreHorizontal className="text-text-secondary cursor-pointer" />
      </div>
      <div className="space-y-4 mt-4">
        {loading && <p className="text-text-secondary text-sm">Loading...</p>}
        {!loading && items.length === 0 && (
          <p className="text-text-secondary text-sm">No data</p>
        )}
        {!loading &&
          items.map((product) => (
            <div key={`${product.name}-${product.sku || ''}`} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-gray-700 p-1 flex items-center justify-center text-xs text-text-secondary">
                  {product.name?.[0] || 'P'}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{product.name}</p>
                  {product.sku && <p className="text-xs text-text-secondary">SKU: {product.sku}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{product.qty.toLocaleString('vi-VN')} sold</p>
                <p className="text-xs text-text-secondary whitespace-nowrap">{formatVND(product.revenue)}</p>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
};

export default PopularProducts;

