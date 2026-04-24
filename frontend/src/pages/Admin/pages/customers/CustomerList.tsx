import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import { fetchCustomers } from '../../../../api/customers';
import { OrdersApi } from '../../../../api/orders';
import { normalizeCountry } from './constants/countries';
import { formatCustomerStatus, formatMemberSinceDate, getCustomerCountry, getDisplayCode, getMemberSinceDate, parseDisplayDate } from './utils/helpers';
import CustomerListHeader from './components/list/CustomerListHeader';
import FilterSection from './components/list/FilterSection';
import CustomerTable from './components/list/CustomerTable';
import Pagination from './components/list/Pagination';
import { formatVND } from '../../../../utils/currency';
import { exportRows, ExportColumn, ExportFormat } from '../../../../utils/exportUtils';

type CustomerExportRow = {
  customerId: string;
  name: string;
  email: string;
  status: string;
  country: string;
  totalOrders: number;
  totalSpent: string;
  memberSince: string;
};

const EXPORT_COLUMNS: ExportColumn<CustomerExportRow>[] = [
  { key: 'customerId', label: 'Customer ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'country', label: 'Country' },
  { key: 'totalOrders', label: 'Total Orders' },
  { key: 'totalSpent', label: 'Total Spent' },
  { key: 'memberSince', label: 'Member Since' },
];

const ITEMS_PER_PAGE = 10;

type CustomerListProps = {
  onSelectCustomer: (id: string) => void;
  setActivePage?: (page: string) => void;
};

const CustomerList: React.FC<CustomerListProps> = ({ onSelectCustomer, setActivePage }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState<string>('');

  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [ordersMin, setOrdersMin] = useState('');
  const [ordersMax, setOrdersMax] = useState('');
  const [joinStart, setJoinStart] = useState('');
  const [joinEnd, setJoinEnd] = useState('');
  const [orderStats, setOrderStats] = useState<
    Record<string, { totalOrders: number; totalSpent: number; firstOrder?: string; country?: string }>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(q);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, any> = { page: 1, limit: 500 };

        const res = await fetchCustomers(params);
        const items = res?.data || res?.items || [];

        let aggregated: Record<string, { totalOrders: number; totalSpent: number; firstOrder?: string; country?: string }> = {};
        try {
          const ordersRes = await OrdersApi.list({ page: 1, limit: 1000, includeItems: 'false' });
          const orderItems = Array.isArray(ordersRes?.data)
            ? ordersRes.data
            : Array.isArray(ordersRes?.items)
              ? ordersRes.items
              : [];
          aggregated = orderItems.reduce((acc, order) => {
            const email = String(order.customerEmail || order.customer?.email || '').toLowerCase();
            if (!email) return acc;
            const entry = acc[email] || { totalOrders: 0, totalSpent: 0, firstOrder: undefined, country: undefined };
            entry.totalOrders += 1;
            // Chỉ tính totalSpent cho các đơn hàng đã thanh toán
            const paymentStatus = String(order.paymentStatus || '').toLowerCase();
            if (paymentStatus === 'paid') {
              entry.totalSpent += Number(order.total) || 0;
            }
            const createdAt = order.createdAt || order.created_at;
            if (createdAt && (!entry.firstOrder || createdAt < entry.firstOrder)) {
              entry.firstOrder = createdAt;
            }
            const shippingCountry =
              order.shippingAddress?.country ||
              order.shipping?.address?.country ||
              order.customer?.address?.country ||
              order.customer?.country ||
              order.address?.country;
            if (shippingCountry && !entry.country) {
              entry.country = normalizeCountry(shippingCountry);
            }
            acc[email] = entry;
            return acc;
          }, {} as Record<string, { totalOrders: number; totalSpent: number; firstOrder?: string; country?: string }>);
        } catch (err) {
        }

        if (!cancelled) {
          const mergedCustomers = items.map((customer: any) => {
            const emailKey = String(customer.email || '').toLowerCase();
            const stats = aggregated[emailKey];
            return {
              ...customer,
              totalOrders: stats?.totalOrders ?? Number(customer.totalOrders ?? customer.orderCount ?? customer.ordersCount ?? 0),
              totalSpent: stats?.totalSpent ?? Number(customer.totalSpent ?? customer.totalPayment ?? 0),
              statsCountry: stats?.country,
              firstOrderDate: stats?.firstOrder,
            };
          });
          setCustomers(mergedCustomers);
          setOrderStats(aggregated);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load customers');
          setCustomers([]);
          setOrderStats({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery, statusFilter, countryFilter, ordersMin, ordersMax, joinStart, joinEnd]);

  const handleResetFilters = () => {
    setStatusFilter('');
    setCountryFilter('');
    setOrdersMin('');
    setOrdersMax('');
    setJoinStart('');
    setJoinEnd('');
  };

  const buildExportRows = (): CustomerExportRow[] => {
    if (!selectedIds.length) return [];
    const idSet = new Set(selectedIds.map((id) => String(id)));
    return customers
      .filter((customer) => idSet.has(String(customer._id || customer.id)))
      .map((customer) => {
        const emailKey = String(customer.email || '').toLowerCase();
        const stats = orderStats[emailKey] || {
          totalOrders: 0,
          totalSpent: 0,
          firstOrder: undefined,
          country: undefined,
        };
        const totalOrders = customer.totalOrders ?? customer.orderCount ?? stats.totalOrders ?? 0;
        const totalSpentRaw = Number(customer.totalSpent ?? customer.totalPayment ?? stats.totalSpent ?? 0);
        const memberSince = getMemberSinceDate(customer.firstOrderDate ? { ...customer, createdAt: customer.createdAt ?? customer.firstOrderDate } : customer, stats.firstOrder);

        return {
          customerId: getDisplayCode(customer._id || customer.id),
          name: customer.fullName || customer.name || '',
          email: customer.email || '',
          status: formatCustomerStatus(customer.status),
          country: getCustomerCountry(customer, stats.country, normalizeCountry) || '—',
          totalOrders,
          totalSpent: formatVND(totalSpentRaw),
          memberSince: formatMemberSinceDate(memberSince),
        };
      });
  };

  const handleExport = (type: ExportFormat) => {
    const rows = buildExportRows();
    if (!rows.length) {
      alert('Please select at least one customer to export.');
      return;
    }
    exportRows(rows, EXPORT_COLUMNS, type, 'customers');
  };

  const filteredCustomers = useMemo(() => {
    const trimmed = deferredQuery.trim();
    const term = trimmed.toLowerCase();
    const codeTerm = term.replace(/^#+/, '');
    const startISO = parseDisplayDate(joinStart);
    const endISO = parseDisplayDate(joinEnd);
    const normalizedCountryFilter = normalizeCountry(countryFilter) || countryFilter;

    return customers.filter((customer) => {
      const name = (customer.fullName || customer.name || '').toLowerCase().trim();
      const normalizedName = name.replace(/\s+/g, ' ');
      const nameTokens = normalizedName.split(' ').filter(Boolean);
      const email = (customer.email || '').toLowerCase();
      const code = getDisplayCode(customer._id || customer.id).replace('#', '').toLowerCase();
      const status = (customer.status || '').toString();
      const country = getCustomerCountry(customer, undefined, normalizeCountry);
      const ordersCount = customer.totalOrders ?? customer.orderCount ?? 0;
      const joinDate = customer.createdAt || customer.joinedAt;
      const joinTime = joinDate ? new Date(joinDate).getTime() : null;
      const startTime = startISO ? new Date(startISO).getTime() : null;
      const endTime = endISO ? new Date(endISO).getTime() : null;

      if (statusFilter && status !== statusFilter) return false;
      if (normalizedCountryFilter && country !== normalizedCountryFilter) return false;
      const ordersMinNum = ordersMin ? Number(ordersMin) : undefined;
      const ordersMaxNum = ordersMax ? Number(ordersMax) : undefined;
      if (ordersMinNum !== undefined && ordersCount < ordersMinNum) return false;
      if (ordersMaxNum !== undefined && ordersCount > ordersMaxNum) return false;
      if (startTime && (!joinTime || joinTime < startTime)) return false;
      if (endTime && (!joinTime || joinTime > endTime)) return false;

      if (!trimmed) return true;

      const matchesName =
        normalizedName.startsWith(term) ||
        nameTokens.some((token) => token.startsWith(term));

      const matchesEmail = email.startsWith(term);
      const matchesCode = code.startsWith(codeTerm);

      return matchesName || matchesEmail || matchesCode;
    });
  }, [customers, deferredQuery, statusFilter, countryFilter, ordersMin, ordersMax, joinStart, joinEnd]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = useMemo(
    () => filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [filteredCustomers, startIndex]
  );
  const pageCustomerIds = paginatedCustomers
    .map((u: any) => String(u._id || u.id))
    .filter(Boolean);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const allChecked = pageCustomerIds.length > 0 && pageCustomerIds.every((id) => selectedIds.includes(id));
  const noneChecked = selectedIds.length === 0;

  function toggleAll() {
    if (!pageCustomerIds.length) return;
    setSelectedIds((prev) => {
      const hasAll = pageCustomerIds.every((id) => prev.includes(id));
      if (hasAll) {
        return prev.filter((id) => !pageCustomerIds.includes(id));
      }
      const merged = [...prev];
      pageCustomerIds.forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
      });
      return merged;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((selected) =>
      selected.includes(id)
        ? selected.filter((i) => i !== id)
        : [...selected, id]
    );
  }

  const paginatedFilteredCustomers = useMemo(
    () => filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [filteredCustomers, startIndex]
  );

  return (
    <div className="bg-background-light p-3 md:p-4 lg:p-6 rounded-lg shadow-lg w-full min-w-0 max-w-full overflow-x-hidden">
      <CustomerListHeader
        searchValue={q}
        onSearchChange={setQ}
        onAddCustomer={() => setActivePage && setActivePage('Add Customer')}
        exportDisabled={noneChecked}
        onExport={handleExport}
      />

      <FilterSection
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        countryFilter={countryFilter}
        onCountryFilterChange={setCountryFilter}
        ordersMin={ordersMin}
        onOrdersMinChange={setOrdersMin}
        ordersMax={ordersMax}
        onOrdersMaxChange={setOrdersMax}
        joinStart={joinStart}
        onJoinStartChange={setJoinStart}
        joinEnd={joinEnd}
        onJoinEndChange={setJoinEnd}
        onResetFilters={handleResetFilters}
      />

      <CustomerTable
        customers={paginatedFilteredCustomers}
        selectedIds={selectedIds}
        orderStats={orderStats}
        loading={loading}
        error={error}
        allChecked={allChecked}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onSelectCustomer={onSelectCustomer}
      />

      <Pagination
        totalItems={filteredCustomers.length}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CustomerList;
