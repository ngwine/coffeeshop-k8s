import React, { useEffect, useState } from 'react';
import { Clock, DollarSign, Package, Users } from 'lucide-react';

import { fetchOrders } from '../../../../../../api/orders';
import { formatVND } from '../../../../../../utils/currency';
import Card from '../common/Card';

const formatRelativeTime = (updatedAt: number, reference: number) => {
  const diffSeconds = Math.max(0, Math.floor((reference - updatedAt) / 1000));
  if (diffSeconds < 5) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;
  const intervals = [
    { label: 'minute', seconds: 60 },
    { label: 'hour', seconds: 3600 },
    { label: 'day', seconds: 86400 },
    { label: 'week', seconds: 604800 },
    { label: 'month', seconds: 2592000 },
    { label: 'year', seconds: 31536000 },
  ];

  for (let i = intervals.length - 1; i >= 0; i--) {
    const { label, seconds } = intervals[i];
    if (diffSeconds >= seconds) {
      const value = Math.floor(diffSeconds / seconds);
      return `${value} ${label}${value === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
};

const parseTimestamp = (value: unknown): number | null => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric > 10_000_000_000 ? numeric : numeric * 1000;
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const recordTimestamp = (record: Record<string, unknown> | null | undefined): number | null => {
  if (!record || typeof record !== 'object') return null;
  const preferredKeys = [
    'updatedAt',
    'updated_at',
    'lastUpdated',
    'last_updated',
    'modifiedAt',
    'modified_at',
    'timestamp',
    'date',
    'createdAt',
    'created_at',
  ];

  for (const key of preferredKeys) {
    if (key in record) {
      const parsed = parseTimestamp((record as any)[key]);
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
};

const findLatestTimestamp = (items: unknown[]): number | null => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items.reduce<number | null>((latest, item) => {
    const ts = recordTimestamp(item as Record<string, unknown>);
    if (ts === null) return latest;
    if (latest === null || ts > latest) return ts;
    return latest;
  }, null);
};

const StatisticsOverview: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState([
    { icon: Users, value: '0', label: 'Total Users', color: 'text-blue-400' },
    { icon: Clock, value: '0', label: 'New Users', color: 'text-green-400' },
    { icon: Package, value: '0', label: 'Total Orders', color: 'text-red-400' },
    { icon: DollarSign, value: formatVND(0), label: 'Revenue', color: 'text-yellow-400' },
  ]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const { fetchCustomers, fetchNewUsersCount } = await import('../../../../../../api/customers');
        
        // Fetch customers để tính total
        const cres = await fetchCustomers({ page: 1, limit: 20 });
        const totalCustomers =
          cres?.pagination?.total ??
          (Array.isArray(cres?.data) ? cres.data.length : 0) ??
          0;
        
        // Fetch new users count từ API (chính xác hơn, đếm từ database)
        let newUsers = 0;
        try {
          const newUsersRes = await fetchNewUsersCount(7); // 7 ngày
          newUsers = newUsersRes?.newUsers ?? newUsersRes?.data?.newUsers ?? 0;
        } catch (err) {
          // Fallback: tính từ customer records nếu API fail
          const customerRecords = Array.isArray(cres?.data)
            ? cres.data
            : Array.isArray(cres?.items)
              ? cres.items
              : [];
          const now = Date.now();
          const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
          newUsers = customerRecords.filter((customer: any) => {
            const createdAt = recordTimestamp(customer);
            if (createdAt === null) return false;
            return createdAt >= sevenDaysAgo;
          }).length;
        }
        
        const customerRecords = Array.isArray(cres?.data)
          ? cres.data
          : Array.isArray(cres?.items)
            ? cres.items
            : [];

        const orResFirst = await fetchOrders({ q: undefined, status: undefined, email: undefined, page: 1, limit: 1 });
        const totalOrders = orResFirst?.pagination?.total ?? 0;
        const limitForRevenue = Math.min(totalOrders, 10000);
        const orRes = await fetchOrders({ q: undefined, status: undefined, email: undefined, page: 1, limit: limitForRevenue });
        const orders = Array.isArray(orRes?.data)
          ? orRes.data
          : Array.isArray(orRes?.items)
            ? orRes.items
            : [];
        const revenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);

        // customerRecords đã được định nghĩa ở trên
        const latestCustomerActivity = findLatestTimestamp(customerRecords);
        const latestOrderActivity = findLatestTimestamp(orders);
        const derivedLastUpdated = latestCustomerActivity !== null || latestOrderActivity !== null
          ? Math.max(
              latestCustomerActivity ?? Number.NEGATIVE_INFINITY,
              latestOrderActivity ?? Number.NEGATIVE_INFINITY,
            )
          : null;

        if (!cancelled) {
          setStats([
            {
              icon: Users,
              value: totalCustomers.toLocaleString('vi-VN'),
              label: 'Total Users',
              color: 'text-blue-400',
            },
            {
              icon: Clock,
              value: newUsers.toLocaleString('vi-VN'),
              label: 'New Users',
              color: 'text-green-400',
            },
            {
              icon: Package,
              value: totalOrders.toLocaleString('vi-VN'),
              label: 'Total Orders',
              color: 'text-red-400',
            },
            {
              icon: DollarSign,
              value: formatVND(revenue),
              label: 'Revenue',
              color: 'text-yellow-400',
            },
          ]);
          setLastUpdated((prev) => derivedLastUpdated ?? prev ?? Date.now());
        }
      } catch (e) {
        if (!cancelled) {
          setStats([
            { icon: Users, value: '0', label: 'Total Users', color: 'text-blue-400' },
            { icon: Clock, value: '0', label: 'New Users', color: 'text-green-400' },
            { icon: Package, value: '0', label: 'Total Orders', color: 'text-red-400' },
            {
              icon: DollarSign,
              value: formatVND(0),
              label: 'Revenue',
              color: 'text-yellow-400',
            },
          ]);
          setLastUpdated((prev) => prev ?? Date.now());
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
    <Card className="col-span-1 md:col-span-5 pt-6">
      {/* HEADER: gộp lại cho responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
        <h3 className="font-bold text-text-primary text-base md:text-lg">
          Simple Dashboard
        </h3>
        <p className="text-xs md:text-sm text-text-secondary">
          {lastUpdated
            ? `Updated ${formatRelativeTime(lastUpdated, nowTick)}`
            : 'Updating...'}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="p-2 bg-gray-700 rounded-md shrink-0">
              <stat.icon size={24} className={stat.color} />
            </div>
            <div className="min-w-0">
              <p className="text-lg md:text-xl font-bold text-text-primary truncate">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-xs md:text-sm text-text-secondary truncate">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};


export default StatisticsOverview;

