import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronDown,
  Circle,
  DollarSign,
  MoreHorizontal,
  Package,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

import { fetchOrders } from '../../../../../../api/orders';
import { ProductsApi } from '../../../../../../api/products';
import { formatVND } from '../../../../../../utils/currency';
import Card from '../common/Card';

type Timeframe = 'year' | 'quarter' | 'month' | 'week';
type ChartType = 'orders' | 'revenue' | 'profit' | 'productsSold' | 'productTypes';
type ChartDetail = 'year' | 'month' | 'quarter' | 'week';
type MetricType = 'orders' | 'sales' | 'profit' | 'income';

const CHART_TYPE_PERMISSIONS: Record<MetricType, Record<ChartType, boolean>> = {
  orders: {
    orders: true,
    revenue: false,
    profit: false,
    productsSold: false,
    productTypes: false,
  },
  sales: {
    orders: false,
    revenue: true,
    profit: false,
    productsSold: true,
    productTypes: true,
  },
  profit: {
    orders: false,
    revenue: false,
    profit: true,
    productsSold: true,
    productTypes: true,
  },
  income: {
    orders: false,
    revenue: true,
    profit: false,
    productsSold: true,
    productTypes: true,
  },
};

const SKU_BRAND_MAP: Record<string, string> = {
  TN: 'Trung Nguyên',
  HC: 'Highlands Coffee',
  PL: 'Phúc Long',
  TCH: 'The Coffee House',
  NS: 'Nespresso',
  TK: 'Tak Coffee',
  MG: 'Highlands Coffee',
};

const BRAND_KEYWORDS: Array<{ keyword: string; brand: string }> = [
  { keyword: 'trung nguyễn', brand: 'Trung Nguyên' },
  { keyword: 'highlands', brand: 'Highlands Coffee' },
  { keyword: 'phúc long', brand: 'Phúc Long' },
  { keyword: 'g7', brand: 'Trung Nguyên' },
  { keyword: 'coffee house', brand: 'The Coffee House' },
  { keyword: 'nespresso', brand: 'Nespresso' },
  { keyword: 'tak coffee', brand: 'Tak Coffee' },
];

const detectBrandName = (name: string, sku?: string) => {
  const skuPrefix = sku?.split('-')?.[1];
  if (skuPrefix && SKU_BRAND_MAP[skuPrefix]) {
    return SKU_BRAND_MAP[skuPrefix];
  }
  const normalized = name.toLowerCase();
  const matchedKeyword = BRAND_KEYWORDS.find(({ keyword }) => normalized.includes(keyword));
  if (matchedKeyword) return matchedKeyword.brand;

  if (name) {
    const firstWords = name.split(' ').slice(0, 2).join(' ');
    if (firstWords.length > 0) {
      return firstWords;
    }
  }
  return 'General';
};

const AdvancedAnalyticsSection: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('year');
  const [chartType, setChartType] = useState<ChartType>('revenue');
  const [chartDetail, setChartDetail] = useState<ChartDetail>('month');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('orders');
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalIncome: 0, // Total income (revenue after discount)
    totalProductsSold: 0,
    ordersPerPeriod: 0,
    orderGrowth: 0, // YoY or MoM growth percentage
    revenueGrowth: 0, // Revenue growth percentage
    incomeGrowth: 0, // Income growth percentage
    averageRevenuePerOrder: 0, // Average revenue per order
    profitMargin: 0, // Profit margin percentage
    profitPerProductSold: 0, // Profit per product sold
    profitGrowth: 0, // Profit growth percentage
  });
  const [loading, setLoading] = useState(false);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [previousOrdersData, setPreviousOrdersData] = useState<any[]>([]);
  const [chartDataState, setChartDataState] = useState<{
    current: number[];
    previous: number[] | null;
    labels: string[];
  }>({ current: [], previous: null, labels: [] });
  const [tableDataState, setTableDataState] = useState<any[]>([]);
  const [productTypeDataState, setProductTypeDataState] = useState<Array<{
    name: string;
    value: number;
    color: string;
    share?: number;
    revenue: number;
    topBrand?: string;
  }>>([]);
  const [productCatalog, setProductCatalog] = useState<Record<string, { category: string; brand: string; name: string; sku?: string }>>({});
  const [productTypeTooltip, setProductTypeTooltip] = useState<{
    name: string;
    quantity: number;
    revenue: number;
    topBrand?: string;
    position: { x: number; y: number };
  } | null>(null);

  const formatAmount = (value: number) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '0';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value));
  };

  type ProductTypeChartPoint = {
    name: string;
    value: number;
    revenue: number;
    topBrand?: string;
  };

  const buildTooltipPosition = (event: React.MouseEvent<HTMLElement | SVGPathElement>) => ({
    x: event.clientX + 16,
    y: event.clientY + 16,
  });

  const handleProductTypeMouseEnter = (
    item: ProductTypeChartPoint,
    event: React.MouseEvent<HTMLElement | SVGPathElement>,
  ) => {
    setProductTypeTooltip({
      name: item.name,
      quantity: item.value,
      revenue: item.revenue,
      topBrand: item.topBrand,
      position: buildTooltipPosition(event),
    });
  };

  const handleProductTypeMouseMove = (event: React.MouseEvent<HTMLElement | SVGPathElement>) => {
    setProductTypeTooltip((prev) =>
      prev
        ? {
            ...prev,
            position: buildTooltipPosition(event),
          }
        : prev,
    );
  };

  const handleProductTypeMouseLeave = () => setProductTypeTooltip(null);

  useEffect(() => {
    let cancelled = false;
    const fetchProductCatalog = async () => {
      try {
        const res = await ProductsApi.list({ page: 1, limit: 1000 });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.items) ? res.items : [];
        if (!cancelled && list.length) {
          const catalog = list.reduce((acc: Record<string, { category: string; brand: string; name: string; sku?: string }>, product: any) => {
            const id = product?.id ?? product?._id;
            if (!id) return acc;
            const brand = product?.brand || detectBrandName(product?.name || '', product?.sku);
            acc[String(id)] = {
              category: product?.category || 'Others',
              brand,
              name: product?.name || `Product #${id}`,
              sku: product?.sku,
            };
            return acc;
          }, {});
          setProductCatalog(catalog);
        }
      } catch (error) {
      }
    };
    fetchProductCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const permissions = CHART_TYPE_PERMISSIONS[selectedMetric];
    if (!permissions) {
      return;
    }
    if (!permissions[chartType]) {
      const fallbackEntry = Object.entries(permissions).find(([, allowed]) => allowed);
      if (fallbackEntry) {
        const [fallbackChart] = fallbackEntry as [ChartType, boolean];
        if (fallbackChart) {
          setChartType(fallbackChart);
        }
      }
    }
  }, [selectedMetric, chartType]);

  const productTypeDetailRows = useMemo(() => {
    if (!Array.isArray(ordersData) || ordersData.length === 0) return [];

    const productMap = new Map<
      string,
      {
        category: string;
        brand: string;
        product: string;
        quantity: number;
        revenue: number;
      }
    >();

    ordersData.forEach((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const productId = item.productId ? String(item.productId) : undefined;
        const catalogEntry = productId ? productCatalog[productId] : undefined;
        const category =
          catalogEntry?.category ||
          item.category ||
          item.type ||
          'Others';
        const brand =
          catalogEntry?.brand ||
          item.brand ||
          item.vendor ||
          detectBrandName(item.name || '', item.sku || catalogEntry?.sku);
        const product =
          item.name ||
          catalogEntry?.name ||
          item.productName ||
          item.sku ||
          `${category} Product`;
        const qty = Number(item.quantity) || Number(item.qty) || 0;
        if (qty <= 0) return;
        const price = Number(item.price) || 0;
        const key = `${category}__${brand}__${product}`;
        if (!productMap.has(key)) {
          productMap.set(key, {
            category,
            brand,
            product,
            quantity: 0,
            revenue: 0,
          });
        }
        const entry = productMap.get(key)!;
        entry.quantity += qty;
        entry.revenue += price * qty;
      });
    });

    const totalQuantity = Array.from(productMap.values()).reduce(
      (sum, entry) => sum + entry.quantity,
      0
    );

    return Array.from(productMap.values())
      .filter((entry) => entry.quantity > 0)
      .map((entry) => ({
        ...entry,
        sharePercent: totalQuantity > 0 ? (entry.quantity / totalQuantity) * 100 : 0,
      }))
      .sort((a, b) => {
        const categoryCompare = a.category.localeCompare(b.category);
        if (categoryCompare !== 0) return categoryCompare;
        const brandCompare = a.brand.localeCompare(b.brand);
        if (brandCompare !== 0) return brandCompare;
        return b.quantity - a.quantity;
      })
      .slice(0, 10);
  }, [ordersData, productCatalog]);

  // Helper functions for date calculations
          const startOfDay = (d: Date) => {
            const x = new Date(d);
            x.setHours(0, 0, 0, 0);
            return x;
          };

          const startOfWeek = (d: Date) => {
            const x = startOfDay(d);
            const day = x.getDay();
            const diff = (day + 6) % 7;
            x.setDate(x.getDate() - diff);
            return x;
          };

          const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  
          const startOfQuarter = (d: Date) => {
            const quarter = Math.floor(d.getMonth() / 3);
            return new Date(d.getFullYear(), quarter * 3, 1);
          };

          const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);

  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date();
    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;

          if (timeframe === 'year') {
            rangeStart = startOfYear(now);
            rangeEnd = now;
          } else if (timeframe === 'quarter') {
            rangeStart = startOfQuarter(now);
            rangeEnd = now;
          } else if (timeframe === 'month') {
            rangeStart = startOfMonth(now);
            rangeEnd = now;
          } else if (timeframe === 'week') {
            rangeStart = startOfWeek(now);
            rangeEnd = now;
          }

    return { rangeStart, rangeEnd };
  };

  // Group orders by period
  const groupOrdersByPeriod = (orders: any[], detail: ChartDetail) => {
    const groups: { [key: string]: any[] } = {};

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      let key = '';

      if (detail === 'year') {
        key = date.getFullYear().toString();
      } else if (detail === 'quarter') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `Q${quarter}`;
      } else if (detail === 'month') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = monthNames[date.getMonth()];
      } else if (detail === 'week') {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        key = dayNames[date.getDay()];
      }

      if (key) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(order);
      }
    });

    return groups;
  };

  // Generate labels for chart
  const generateLabels = (detail: ChartDetail, rangeStart: Date | null, rangeEnd: Date | null) => {
    const labels: string[] = [];
    const now = rangeEnd || new Date();
    const start = rangeStart || startOfYear(now);

    if (detail === 'year') {
      const currentYear = now.getFullYear();
      const startYear = start.getFullYear();
      for (let year = startYear; year <= currentYear; year++) {
        labels.push(year.toString());
      }
    } else if (detail === 'quarter') {
      labels.push('Q1', 'Q2', 'Q3', 'Q4');
    } else if (detail === 'month') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (timeframe === 'year') {
        labels.push(...monthNames);
      } else {
        const currentMonth = now.getMonth();
        const startMonth = start.getMonth();
        for (let month = startMonth; month <= currentMonth; month++) {
          labels.push(monthNames[month]);
        }
      }
    } else if (detail === 'week') {
      labels.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
    }

    return labels;
  };

  // Calculate chart data from orders
  const calculateChartData = (orders: any[], previousOrders: any[] | null) => {
    const { rangeStart, rangeEnd } = getDateRange();
    const labels = generateLabels(chartDetail, rangeStart, rangeEnd);
    const groups = groupOrdersByPeriod(orders, chartDetail);
    const previousGroups = previousOrders ? groupOrdersByPeriod(previousOrders, chartDetail) : null;

    const current: number[] = [];
    const previous: number[] | null = previousOrders ? [] : null;

    // Determine if we should convert to thousands (k) - only for monetary values
    const shouldConvertToK = (chartType === 'revenue' || chartType === 'profit' || selectedMetric === 'sales' || selectedMetric === 'income' || selectedMetric === 'profit') && chartType !== 'orders';

    // Helper function to get previous period label for comparison
    // When timeframe is 'year' and detail is 'month', compare same month of previous year (YoY)
    // When timeframe is 'month' and detail is 'week', compare same week of previous month
    // When timeframe is 'quarter' and detail is 'month', compare same month of previous quarter
    // Otherwise, compare with the previous period (previous month, previous week, etc.)
    const getPreviousPeriodLabel = (currentLabel: string, detail: ChartDetail): string | null => {
      // For year timeframe with month detail, compare same month of previous year (YoY)
      if (timeframe === 'year' && detail === 'month') {
        // Same month name, but from previous year's data
        return currentLabel;
      }
      // For month timeframe with week detail, compare same week of previous month
      else if (timeframe === 'month' && detail === 'week') {
        // Same week day name, but from previous month's data
        return currentLabel;
      }
      // For quarter timeframe with month detail, compare same month of previous quarter
      else if (timeframe === 'quarter' && detail === 'month') {
        // Same month name, but from previous quarter's data
        return currentLabel;
      }
      // For other cases, compare with the previous period
      else {
        if (detail === 'month') {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const currentIndex = monthNames.indexOf(currentLabel);
          if (currentIndex === -1) return null;
          // Get previous month (if Jan, previous is Dec of previous period)
          const prevIndex = currentIndex === 0 ? 11 : currentIndex - 1;
          return monthNames[prevIndex];
        } else if (detail === 'week') {
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const currentIndex = dayNames.indexOf(currentLabel);
          if (currentIndex === -1) return null;
          const prevIndex = currentIndex === 0 ? 6 : currentIndex - 1;
          return dayNames[prevIndex];
        } else if (detail === 'quarter') {
          const quarter = parseInt(currentLabel.replace('Q', ''));
          if (quarter === 1) return 'Q4';
          return `Q${quarter - 1}`;
        } else if (detail === 'year') {
          const year = parseInt(currentLabel);
          return (year - 1).toString();
        }
      }
      return null;
    };

    labels.forEach((label, index) => {
      const periodOrders = groups[label] || [];
      let value = 0;

      if (chartType === 'productTypes') {
        // Count unique product types in this period
        const types = new Set<string>();
        periodOrders.forEach((order: any) => {
          const items = Array.isArray(order.items) ? order.items : [];
          items.forEach((item: any) => {
            const type = item.category || item.type || 'Others';
            types.add(type);
          });
        });
        value = types.size;
      } else {
        periodOrders.forEach((order: any) => {
          if (chartType === 'orders') {
            value += 1; // Count orders
          } else if (chartType === 'revenue' || selectedMetric === 'sales') {
            value += Number(order.total) || 0;
          } else if (selectedMetric === 'income') {
            // Income = order.total - discountValue
            const total = Number(order.total) || 0;
            const discount = Number(order.discount) || 0;
            value += total - discount;
          } else if (chartType === 'profit' || selectedMetric === 'profit') {
            const revenue = Number(order.total) || 0;
            // Calculate profit: profit = order.total - costOfGoods
            // If cost not available, use 20% of revenue as cost (profit = 80% of revenue)
            const costOfGoods = Number(order.costOfGoods) || Number(order.cost) || (revenue * 0.2);
            value += revenue - costOfGoods;
          } else if (chartType === 'productsSold' || selectedMetric === 'orders') {
            if (chartType === 'productsSold') {
              const items = Array.isArray(order.items) ? order.items : [];
              value += items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || Number(item.qty) || 0), 0);
            } else {
              value += 1; // Count orders
            }
          }
        });
      }

      // Convert to thousands (k) only for monetary values, keep as-is for counts
      current.push(shouldConvertToK ? value / 1000 : value);

      if (previous) {
        // For comparison, we need to get the previous period's data
        // If chartDetail is 'month', compare with the previous month (not same month of previous year)
        // If chartDetail is 'year', compare with the previous year
        // If chartDetail is 'quarter', compare with the previous quarter
        // If chartDetail is 'week', compare with the previous week
        const prevLabel = getPreviousPeriodLabel(label, chartDetail);
        const prevPeriodOrders = prevLabel && previousGroups ? (previousGroups[prevLabel] || []) : [];
        let prevValue = 0;

        if (chartType === 'productTypes') {
          const types = new Set<string>();
          prevPeriodOrders.forEach((order: any) => {
            const items = Array.isArray(order.items) ? order.items : [];
            items.forEach((item: any) => {
              const type = item.category || item.type || 'Others';
              types.add(type);
            });
          });
          prevValue = types.size;
        } else {
          prevPeriodOrders.forEach((order: any) => {
            if (chartType === 'orders') {
              prevValue += 1; // Count orders
            } else if (chartType === 'revenue' || selectedMetric === 'sales') {
              prevValue += Number(order.total) || 0;
            } else if (selectedMetric === 'income') {
              // Income = order.total - discountValue
              const total = Number(order.total) || 0;
              const discount = Number(order.discount) || 0;
              prevValue += total - discount;
            } else if (chartType === 'profit' || selectedMetric === 'profit') {
              const revenue = Number(order.total) || 0;
              // Calculate profit: profit = order.total - costOfGoods
              // If cost not available, use 20% of revenue as cost (profit = 80% of revenue)
              const costOfGoods = Number(order.costOfGoods) || Number(order.cost) || (revenue * 0.2);
              prevValue += revenue - costOfGoods;
            } else if (chartType === 'productsSold' || selectedMetric === 'orders') {
              if (chartType === 'productsSold') {
                const items = Array.isArray(order.items) ? order.items : [];
                prevValue += items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || Number(item.qty) || 0), 0);
              } else {
                prevValue += 1;
              }
            }
          });
        }

        previous.push(shouldConvertToK ? prevValue / 1000 : prevValue);
      }
    });

    return { current, previous, labels };
  };

  // Calculate table data from orders
  const calculateTableData = (orders: any[]) => {
    const { rangeStart, rangeEnd } = getDateRange();
    const labels = generateLabels(chartDetail, rangeStart, rangeEnd);
    const groups = groupOrdersByPeriod(orders, chartDetail);

    const statusBuckets = {
      completed: ['delivered', 'completed', 'shipped'],
      pending: ['pending', 'processing', 'created', 'awaiting_payment'],
      cancelled: ['cancelled', 'canceled', 'returned', 'failed', 'refunded'],
    };

    const baseRows = labels.map((label) => {
      const periodOrders = groups[label] || [];
      let revenue = 0;
      let profit = 0;
      let cost = 0;
      let productsSold = 0;
      let discountUsed = 0;
      const productQuantities: Record<string, number> = {};
      const statusCounts = { completed: 0, pending: 0, cancelled: 0 };

      periodOrders.forEach((order: any) => {
        const total = Number(order.total) || 0;
        revenue += total;
        const discount = Number(order.discount) || 0;
        discountUsed += discount;

        const costOfGoods = Number(order.costOfGoods) || Number(order.cost) || total * 0.2;
        profit += total - costOfGoods;
        cost += costOfGoods;

        const status = String(order.status || '').toLowerCase();
        if (statusBuckets.completed.includes(status)) {
          statusCounts.completed += 1;
        } else if (statusBuckets.pending.includes(status)) {
          statusCounts.pending += 1;
        } else if (statusBuckets.cancelled.includes(status)) {
          statusCounts.cancelled += 1;
        }

        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach((item: any) => {
          const qty = Number(item.quantity) || Number(item.qty) || 0;
          if (qty <= 0) return;
          productsSold += qty;
          const productName = item.name || item.productName || item.sku || 'Product';
          productQuantities[productName] = (productQuantities[productName] || 0) + qty;
        });
      });

      const ordersCount = periodOrders.length;
      const income = revenue - discountUsed;
      const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0;
      const avgProductsPerOrder = ordersCount > 0 ? productsSold / ordersCount : 0;
      const profitMarginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;
      const topProduct =
        Object.entries(productQuantities).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

      return {
        period: label,
        revenue,
        income,
        profit,
        cost,
        orders: ordersCount,
        productsSold,
        avgOrderValue,
        avgProductsPerOrder,
        discountUsed,
        completedOrders: statusCounts.completed,
        pendingOrders: statusCounts.pending,
        cancelledOrders: statusCounts.cancelled,
        profitMarginPercent,
        topProduct,
      };
    });

    return baseRows.map((row, index) => {
      const prevRow = index > 0 ? baseRows[index - 1] : null;
      const ordersGrowthPercent =
        prevRow && prevRow.orders > 0 ? ((row.orders - prevRow.orders) / prevRow.orders) * 100 : 0;
      const revenueGrowthPercent =
        prevRow && prevRow.revenue > 0 ? ((row.revenue - prevRow.revenue) / prevRow.revenue) * 100 : 0;
      const profitGrowthPercent =
        prevRow && prevRow.profit > 0 ? ((row.profit - prevRow.profit) / prevRow.profit) * 100 : 0;
      const incomeGrowthPercent =
        prevRow && prevRow.income > 0 ? ((row.income - prevRow.income) / prevRow.income) * 100 : 0;

      return {
        ...row,
        ordersGrowthPercent,
        revenueGrowthPercent,
        profitGrowthPercent,
        incomeGrowthPercent,
      };
    });
  };

  // Calculate product type distribution
  const calculateProductTypeDistribution = (orders: any[]) => {
    const typeCounts: {
      [key: string]: {
        quantity: number;
        revenue: number;
        brands: Record<string, { quantity: number; revenue: number }>;
      };
    } = {};
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6b7280'];

    orders.forEach((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const productId = item.productId ? String(item.productId) : undefined;
        const catalogEntry = productId ? productCatalog[productId] : undefined;
        const category =
          catalogEntry?.category ||
          item.category ||
          item.type ||
          item.name?.split(' ')[0] ||
          'Others';
        const brand =
          catalogEntry?.brand ||
          item.brand ||
          item.vendor ||
          detectBrandName(item.name || '', item.sku || catalogEntry?.sku);
        const quantity = Number(item.quantity) || Number(item.qty) || 0;
        if (quantity <= 0) return;
        const revenueContribution = (Number(item.price) || 0) * quantity;
        if (!typeCounts[category]) {
          typeCounts[category] = { quantity: 0, revenue: 0, brands: {} };
        }
        const categoryEntry = typeCounts[category];
        categoryEntry.quantity += quantity;
        categoryEntry.revenue += revenueContribution;
        if (!categoryEntry.brands[brand]) {
          categoryEntry.brands[brand] = { quantity: 0, revenue: 0 };
        }
        categoryEntry.brands[brand].quantity += quantity;
        categoryEntry.brands[brand].revenue += revenueContribution;
      });
    });

    const totalQuantity = Object.values(typeCounts).reduce((sum, entry) => sum + entry.quantity, 0);
    if (totalQuantity === 0) {
      return [
        { name: 'No Data', value: 1, share: 100, color: '#6b7280', revenue: 0, topBrand: '—' },
      ];
    }

    const sorted = Object.entries(typeCounts)
      .map(([name, stats], index) => {
        const topBrand =
          Object.entries(stats.brands)
            .sort((a, b) => b[1].quantity - a[1].quantity)[0]?.[0] || '—';
        return {
          name,
          value: stats.quantity,
          revenue: stats.revenue,
          topBrand,
          share: (stats.quantity / totalQuantity) * 100,
          color: colors[index % colors.length],
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return sorted;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { rangeStart, rangeEnd } = getDateRange();

        // Fetch current period orders
        const params: any = { page: 1, limit: 10000, includeItems: 'true' };
        if (rangeStart && rangeEnd) {
          // Always use 'custom' range when we have specific dates
          // Backend supports: 'today', 'yesterday', 'week', 'month', 'custom'
          params.range = 'custom';
          params.startDate = rangeStart.toISOString();
          params.endDate = rangeEnd.toISOString();
        } else {
          // Fallback to timeframe if no dates provided
          // Map timeframe to backend-supported ranges
          if (timeframe === 'week') {
            params.range = 'week';
          } else if (timeframe === 'month') {
            params.range = 'month';
          } else {
            // For 'year' and 'quarter', we need to use 'custom' with calculated dates
            params.range = 'custom';
            const fallbackRange = getDateRange();
            if (fallbackRange.rangeStart && fallbackRange.rangeEnd) {
              params.startDate = fallbackRange.rangeStart.toISOString();
              params.endDate = fallbackRange.rangeEnd.toISOString();
            }
          }
        }

        const res = await fetchOrders(params);
        const orders = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.items) ? res.items : []);
        setOrdersData(orders);

        // Fetch previous period orders if comparison is enabled
        let prevOrders: any[] = [];
        if (compareWithPrevious && rangeStart && rangeEnd) {
          let prevRangeStart: Date;
          let prevRangeEnd: Date;

          // Calculate previous period based on timeframe
          if (timeframe === 'year') {
            // Previous year: same date range but one year earlier
            prevRangeStart = new Date(rangeStart);
            prevRangeStart.setFullYear(rangeStart.getFullYear() - 1);
            prevRangeEnd = new Date(rangeEnd);
            prevRangeEnd.setFullYear(rangeEnd.getFullYear() - 1);
          } else if (timeframe === 'quarter') {
            // Previous quarter: same date range but one quarter earlier
            prevRangeStart = new Date(rangeStart);
            prevRangeStart.setMonth(rangeStart.getMonth() - 3);
            prevRangeEnd = new Date(rangeEnd);
            prevRangeEnd.setMonth(rangeEnd.getMonth() - 3);
          } else if (timeframe === 'month') {
            // Previous month: same date range but one month earlier
            prevRangeStart = new Date(rangeStart);
            prevRangeStart.setMonth(rangeStart.getMonth() - 1);
            prevRangeEnd = new Date(rangeEnd);
            prevRangeEnd.setMonth(rangeEnd.getMonth() - 1);
          } else if (timeframe === 'week') {
            // Previous week: same date range but one week earlier
            const periodDiff = rangeEnd.getTime() - rangeStart.getTime();
            prevRangeEnd = new Date(rangeStart.getTime() - 1);
            prevRangeStart = new Date(prevRangeEnd.getTime() - periodDiff);
          } else {
            // Fallback: use period difference
            const periodDiff = rangeEnd.getTime() - rangeStart.getTime();
            prevRangeEnd = new Date(rangeStart.getTime() - 1);
            prevRangeStart = new Date(prevRangeEnd.getTime() - periodDiff);
          }

          const prevParams: any = { page: 1, limit: 10000, includeItems: 'true', range: 'custom' };
          prevParams.startDate = prevRangeStart.toISOString();
          prevParams.endDate = prevRangeEnd.toISOString();

          const prevRes = await fetchOrders(prevParams);
          prevOrders = Array.isArray(prevRes?.data) ? prevRes.data : (Array.isArray(prevRes?.items) ? prevRes.items : []);
          setPreviousOrdersData(prevOrders);
        } else {
          setPreviousOrdersData([]);
        }

        // Calculate metrics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
        // Calculate income: income = order.total - discount
        const totalIncome = orders.reduce((sum: number, o: any) => {
          const total = Number(o.total) || 0;
          const discount = Number(o.discount) || 0;
          return sum + (total - discount);
        }, 0);
        // Calculate profit: profit = order.total - costOfGoods
        // If cost not available, use 20% of revenue as cost (profit = 80% of revenue)
        const totalProfit = orders.reduce((sum: number, o: any) => {
          const revenue = Number(o.total) || 0;
          // Try to get cost from order data, if not available use 20% of revenue
          const costOfGoods = Number(o.costOfGoods) || Number(o.cost) || (revenue * 0.2);
          return sum + (revenue - costOfGoods);
        }, 0);
        const totalProductsSold = orders.reduce((sum: number, o: any) => {
          const items = Array.isArray(o.items) ? o.items : [];
          return sum + items.reduce((itemSum: number, item: any) => itemSum + (Number(item.quantity) || Number(item.qty) || 0), 0);
        }, 0);

        // Calculate orders per period and growth
        const dateRange = getDateRange();
        const periodDays = dateRange.rangeStart && dateRange.rangeEnd ? Math.ceil((dateRange.rangeEnd.getTime() - dateRange.rangeStart.getTime()) / (1000 * 60 * 60 * 24)) : 1;
        const ordersPerPeriod = periodDays > 0 ? (totalOrders / periodDays) : 0;
        
        // Calculate growth (YoY or MoM)
        let orderGrowth = 0;
        if (prevOrders.length > 0) {
          const previousTotalOrders = prevOrders.length;
          if (previousTotalOrders > 0) {
            orderGrowth = ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100;
          }
        }

        // Calculate revenue growth
        let revenueGrowth = 0;
        if (prevOrders.length > 0) {
          const previousRevenue = prevOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
          if (previousRevenue > 0) {
            revenueGrowth = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
          }
        }

        // Calculate income growth
        let incomeGrowth = 0;
        if (prevOrders.length > 0) {
          const previousIncome = prevOrders.reduce((sum: number, o: any) => {
            const total = Number(o.total) || 0;
            const discount = Number(o.discount) || 0;
            return sum + (total - discount);
          }, 0);
          if (previousIncome > 0) {
            incomeGrowth = ((totalIncome - previousIncome) / previousIncome) * 100;
          }
        }

        // Calculate average revenue per order
        const averageRevenuePerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate profit margin (profit / revenue * 100)
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        // Calculate profit per product sold
        const profitPerProductSold = totalProductsSold > 0 ? totalProfit / totalProductsSold : 0;

        // Calculate profit growth
        let profitGrowth = 0;
        if (prevOrders.length > 0) {
          const previousProfit = prevOrders.reduce((sum: number, o: any) => {
            const revenue = Number(o.total) || 0;
            const costOfGoods = Number(o.costOfGoods) || Number(o.cost) || (revenue * 0.2);
            return sum + (revenue - costOfGoods);
          }, 0);
          if (previousProfit > 0) {
            profitGrowth = ((totalProfit - previousProfit) / previousProfit) * 100;
          }
        }

        setMetrics({ 
          totalOrders, 
          totalRevenue, 
          totalProfit,
          totalIncome,
          totalProductsSold, 
          ordersPerPeriod, 
          orderGrowth,
          revenueGrowth,
          incomeGrowth,
          averageRevenuePerOrder,
          profitMargin,
          profitPerProductSold,
          profitGrowth,
        });

        // Calculate chart data
        const chartData = calculateChartData(orders, compareWithPrevious ? prevOrders : null);
        setChartDataState(chartData);

        // Calculate table data
        const tableData = calculateTableData(orders);
        setTableDataState(tableData);

        // Calculate product type distribution
        const productTypes = calculateProductTypeDistribution(orders);
        setProductTypeDataState(productTypes);
      } catch (error) {
        setMetrics({ 
          totalOrders: 0, 
          totalRevenue: 0, 
          totalProfit: 0,
          totalIncome: 0,
          totalProductsSold: 0, 
          ordersPerPeriod: 0, 
          orderGrowth: 0,
          revenueGrowth: 0,
          incomeGrowth: 0,
          averageRevenuePerOrder: 0,
          profitMargin: 0,
          profitPerProductSold: 0,
          profitGrowth: 0,
        });
        setChartDataState({ current: [], previous: null, labels: [] });
        setTableDataState([]);
        setProductTypeDataState([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, chartType, chartDetail, selectedMetric, compareWithPrevious]);

  // Use real data from state
  const chartData = chartDataState;
  const allValues = [...chartData.current, ...(chartData.previous || [])];
  const maxValue = Math.max(...allValues, 1);
  
  // Determine if we should use "k" notation based on chart type
  const shouldUseK = (chartType === 'revenue' || chartType === 'profit' || selectedMetric === 'sales' || selectedMetric === 'income' || selectedMetric === 'profit') && chartType !== 'orders';
  
  // Calculate max value for Y-axis scaling
  let maxValueK: number;
  if (shouldUseK) {
    // For monetary values, round up to nearest 10k
    maxValueK = Math.ceil(maxValue / 10) * 10;
  } else {
    // For counts, round up to nearest 5 or 10 depending on value
    if (maxValue < 10) {
      maxValueK = Math.ceil(maxValue);
    } else if (maxValue < 50) {
      maxValueK = Math.ceil(maxValue / 5) * 5;
    } else {
      maxValueK = Math.ceil(maxValue / 10) * 10;
    }
  }

  // Generate Y-axis labels dynamically based on maxValueK
  const generateYAxisLabels = () => {
    const steps = 5; // Number of steps on Y-axis
    const stepValue = maxValueK / steps;
    const labels = [];
    for (let i = steps; i >= 0; i--) {
      labels.push(i * stepValue);
    }
    return labels;
  };

  const yAxisLabels = generateYAxisLabels();
  const chartInnerHeight = 240;
  const productTypeMaxValue =
    productTypeDataState.length > 0
      ? Math.max(...productTypeDataState.map((item) => item.value))
      : 1;
  const productTypeYAxisLabels = Array.from({ length: 6 }, (_, idx) => {
    const step = productTypeMaxValue / 5 || 1;
    return Math.round(step * (5 - idx));
  });
  const totalProductTypeValue = productTypeDataState.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  return (
    <Card>
      {/* Advanced Dashboard Title */}
      <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Advanced Dashboard</h2>
        <p className="text-sm text-text-secondary">Track revenue, profit, and orders by time period</p>
        </div>

      {/* KPI Selector (Layer 1) */}
      <div className="flex flex-wrap gap-3 mb-6 select-none">
        {([
          { type: 'orders' as MetricType, label: 'Orders', icon: ShoppingCart },
          { type: 'sales' as MetricType, label: 'Sales', icon: BarChart3 },
          { type: 'profit' as MetricType, label: 'Profit', icon: DollarSign },
          { type: 'income' as MetricType, label: 'Income', icon: TrendingUp },
        ]).map((metric) => {
          const isActive = selectedMetric === metric.type;
          
          return (
            <button
              key={metric.type}
              onClick={() => {
                setSelectedMetric(metric.type);
                // When clicking Orders metric, switch to Orders chart type
                if (metric.type === 'orders') {
                  setChartType('orders');
                } else if (metric.type === 'sales') {
                  setChartType('revenue');
                } else if (metric.type === 'profit') {
                  setChartType('profit');
                } else if (metric.type === 'income') {
                  setChartType('revenue');
                }
              }}
              className={`no-hover-effect flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-none focus:outline-none ${
                isActive
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-gray-600 bg-background-dark text-text-secondary'
              }`}
            >
              <metric.icon size={20} />
              <span className="font-semibold">{metric.label}</span>
            </button>
          );
        })}
      </div>

      {/* Time Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(['year', 'quarter', 'month', 'week'] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`no-hover-effect px-3 py-1 rounded-md text-sm border transition-none focus:outline-none ${
                timeframe === tf
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background-dark border-gray-600 text-text-secondary'
              }`}
            >
            {tf === 'year' ? 'Year' : tf === 'quarter' ? 'Quarter' : tf === 'month' ? 'Month' : 'Week'}
            </button>
          ))}
        </div>

      {/* KPI Cards Row */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 ${
          selectedMetric === 'profit' ||
          selectedMetric === 'income' ||
          selectedMetric === 'sales' ||
          selectedMetric === 'orders'
            ? 'md:grid-cols-3'
            : 'md:grid-cols-4'
        }`}
      >
        {selectedMetric === 'orders' ? (
          <>
            {/* Card 1: Total Orders */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-purple-500/20 rounded-md">
                    <ShoppingCart size={24} className="text-purple-400" />
      </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : metrics.totalOrders.toLocaleString('en-US')}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.orderGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.orderGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.orderGrowth >= 0 ? '+' : ''}{metrics.orderGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Orders Per Period */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-500/20 rounded-md">
                    <BarChart3 size={24} className="text-blue-400" />
        </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Orders Per Period</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : metrics.ordersPerPeriod.toFixed(2)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.ordersPerPeriod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.ordersPerPeriod >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.ordersPerPeriod >= 0 ? 'Positive' : 'Negative'}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 3: YoY / MoM Order Growth */}
        <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-yellow-500/20 rounded-md">
                    <TrendingUp size={24} className="text-yellow-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">
                    {timeframe === 'year' ? 'YoY' : 'MoM'} Order Growth
                  </p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : `${metrics.orderGrowth >= 0 ? '+' : ''}${metrics.orderGrowth.toFixed(1)}%`}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.orderGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.orderGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.orderGrowth >= 0 ? 'Positive' : 'Negative'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : selectedMetric === 'sales' ? (
          <>
            {/* Card 1: Total Revenue */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-green-500/20 rounded-md">
                    <DollarSign size={24} className="text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.totalRevenue)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.revenueGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Revenue Growth */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-yellow-500/20 rounded-md">
                    <TrendingUp size={24} className="text-yellow-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Revenue Growth</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : `${metrics.revenueGrowth >= 0 ? '+' : ''}${metrics.revenueGrowth.toFixed(1)}%`}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.revenueGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.revenueGrowth >= 0 ? 'Positive' : 'Negative'}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 3: Average Revenue Per Order */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-500/20 rounded-md">
                    <BarChart3 size={24} className="text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Average Revenue Per Order</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.averageRevenuePerOrder)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.averageRevenuePerOrder >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.averageRevenuePerOrder >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.averageRevenuePerOrder >= 0 ? 'Positive' : 'Negative'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : selectedMetric === 'profit' ? (
          <>
            {/* Card 1: Total Profit */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-yellow-500/20 rounded-md">
                    <TrendingUp size={24} className="text-yellow-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Total Profit</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.totalProfit)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.profitGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.profitGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.profitGrowth >= 0 ? '+' : ''}{metrics.profitGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Profit Margin */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-green-500/20 rounded-md">
                    <BarChart3 size={24} className="text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Profit Margin</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : `${metrics.profitMargin.toFixed(2)}%`}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.profitMargin >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.profitMargin >= 0 ? '+' : ''}{metrics.profitMargin.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 3: Profit Per Product Sold */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-500/20 rounded-md">
              <Package size={24} className="text-blue-400" />
                  </div>
            </div>
            <div>
                  <p className="text-sm text-text-secondary mb-1">Profit Per Product Sold</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.profitPerProductSold)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.profitPerProductSold >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.profitPerProductSold >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.profitPerProductSold >= 0 ? 'Positive' : 'Negative'}</span>
                  </div>
            </div>
          </div>
        </Card>
          </>
        ) : selectedMetric === 'income' ? (
          <>
            {/* Card 1: Total Actual Revenue */}
        <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
            <div className="p-3 bg-green-500/20 rounded-md">
              <DollarSign size={24} className="text-green-400" />
                  </div>
            </div>
            <div>
                  <p className="text-sm text-text-secondary mb-1">Total Actual Revenue</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                {loading ? '...' : formatVND(metrics.totalRevenue)}
              </p>
                  <div className={`flex items-center gap-1 ${metrics.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.revenueGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%</span>
                  </div>
            </div>
          </div>
        </Card>

            {/* Card 2: Revenue After Discount */}
        <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
            <div className="p-3 bg-yellow-500/20 rounded-md">
              <TrendingUp size={24} className="text-yellow-400" />
                  </div>
            </div>
            <div>
                  <p className="text-sm text-text-secondary mb-1">Revenue After Discount</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.totalIncome)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.incomeGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.incomeGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.incomeGrowth >= 0 ? '+' : ''}{metrics.incomeGrowth.toFixed(1)}%</span>
                  </div>
            </div>
          </div>
        </Card>

            {/* Card 3: Net Income Over Time */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-500/20 rounded-md">
                    <BarChart3 size={24} className="text-blue-400" />
      </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Net Income Over Time</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.totalIncome)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.incomeGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.incomeGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.incomeGrowth >= 0 ? '+' : ''}{metrics.incomeGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Default KPI Cards for other metrics */}
            {/* Card 1: Total Actual Revenue */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-green-500/20 rounded-md">
                    <DollarSign size={24} className="text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Total Actual Revenue</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.totalRevenue)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.revenueGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Revenue After Discount */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-yellow-500/20 rounded-md">
                    <TrendingUp size={24} className="text-yellow-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Revenue After Discount</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.totalIncome)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.incomeGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.incomeGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.incomeGrowth >= 0 ? '+' : ''}{metrics.incomeGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 3: Net Income Over Time */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-500/20 rounded-md">
                    <BarChart3 size={24} className="text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Net Income Over Time</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : formatVND(metrics.totalIncome)}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.incomeGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.incomeGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.incomeGrowth >= 0 ? '+' : ''}{metrics.incomeGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 4: Total Orders */}
            <Card>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-purple-500/20 rounded-md">
                    <ShoppingCart size={24} className="text-purple-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {loading ? '...' : metrics.totalOrders.toLocaleString('en-US')}
                  </p>
                  <div className={`flex items-center gap-1 ${metrics.orderGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.orderGrowth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="text-sm font-semibold">{metrics.orderGrowth >= 0 ? '+' : ''}{metrics.orderGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Chart Type Selector (Layer 2) */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm text-text-secondary mr-2">Chart Type:</span>
        {(['orders', 'revenue', 'profit', 'productsSold', 'productTypes'] as ChartType[]).map(ct => {
            const metricPermissions = CHART_TYPE_PERMISSIONS[selectedMetric] || {};
            const isDisabled = metricPermissions[ct] === false;
            const isActive = chartType === ct;

          return (
            <button
              key={ct}
              onClick={() => {
                if (!isDisabled) {
                  setChartType(ct);
                }
              }}
              disabled={isDisabled}
              className={`no-hover-effect px-3 py-1 rounded-md text-sm border transition-none focus:outline-none ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : isDisabled
                    ? 'bg-background-dark border-gray-700 text-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-background-dark border-gray-600 text-text-secondary'
              }`}
            >
              {ct === 'orders' ? 'Orders' : ct === 'revenue' ? 'Revenue' : ct === 'profit' ? 'Profit' : ct === 'productsSold' ? 'Products Sold' : 'Product Types'}
            </button>
          );
        })}
        </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary mr-2">Detail by:</span>
          {(['year', 'month', 'quarter', 'week'] as ChartDetail[]).map((cd) => (
            <button
              key={cd}
              onClick={() => setChartDetail(cd)}
              className={`no-hover-effect px-3 py-1 rounded-md text-sm border transition-none focus:outline-none ${
                chartDetail === cd
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background-dark border-gray-600 text-text-secondary'
              }`}
            >
              {cd === 'year'
                ? 'Year'
                : cd === 'month'
                  ? 'Month'
                  : cd === 'quarter'
                    ? 'Quarter'
                    : 'Week'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Compare vs Previous Period</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compareWithPrevious}
              onChange={(e) => setCompareWithPrevious(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                compareWithPrevious ? 'bg-primary' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  compareWithPrevious ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="space-y-6">

        {/* Chart Area */}
        <div className={`grid ${chartType === 'productTypes' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6 items-stretch`}>
          {chartType === 'productTypes' ? (
            <>
              <div className="bg-background-light p-6 rounded-lg flex flex-col">
                <h3 className="font-bold text-text-primary mb-4">Product Type Volume</h3>
                {productTypeDataState.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-text-secondary">
                    No product type data available.
                  </div>
                ) : (
                  <div className="flex-1 border-l border-b border-gray-700 relative px-8 py-6">
                    <div className="relative w-full" style={{ height: chartInnerHeight }}>
                      <div className="absolute left-0 top-0 bottom-0 -translate-x-full -ml-6 pr-6 flex flex-col justify-between text-xs text-text-secondary text-right">
                        {productTypeYAxisLabels.map((value, idx) => (
                          <span key={idx}>{value}</span>
                        ))}
                      </div>
                      <div className="flex h-full justify-around items-end relative">
                        {productTypeDataState.map((item) => {
                          const heightPx = Math.max((item.value / productTypeMaxValue) * chartInnerHeight, 4);
                          const isTopPerformer = item.value === productTypeMaxValue;
                          return (
                            <div key={item.name} className="flex flex-col items-center w-full h-full justify-end relative">
                              <div className="flex items-end gap-1 w-full justify-center relative">
                                <div
                                  className={`rounded-t-md transition-all duration-300 cursor-pointer relative ${
                                    isTopPerformer ? 'shadow-lg shadow-primary/40' : ''
                                  }`}
                                  style={{
                                    height: `${heightPx}px`,
                                    width: '40%',
                                    minHeight: '4px',
                                    backgroundColor: item.color,
                                  }}
                                  title={`${item.name}: ${item.value.toLocaleString('en-US')} units`}
                                  onMouseEnter={(event) => handleProductTypeMouseEnter(item, event)}
                                  onMouseMove={handleProductTypeMouseMove}
                                  onMouseLeave={handleProductTypeMouseLeave}
                                >
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-text-primary whitespace-nowrap z-10">
                                    {item.value.toLocaleString('en-US')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {productTypeDataState.length > 0 && (
                  <div className="flex justify-around gap-4 px-4 mt-4">
                    {productTypeDataState.map((item) => (
                      <span
                        key={`${item.name}-label`}
                        className="text-xs text-text-secondary text-center w-full leading-tight break-words"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-background-light p-6 rounded-lg flex flex-col">
                <h3 className="font-bold text-text-primary mb-4">Product Type Distribution</h3>
                <div className="flex-1 flex items-center justify-center min-h-[320px]">
                  <div className="relative w-64 h-64">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {(() => {
                        let currentAngle = 0;
                        const total = totalProductTypeValue || 1;
                        return productTypeDataState.map((item, i) => {
                          const percentage = (item.value / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const largeArcFlag = percentage > 50 ? 1 : 0;
                          const x1 = 50 + 50 * Math.cos((currentAngle * Math.PI) / 180);
                          const y1 = 50 + 50 * Math.sin((currentAngle * Math.PI) / 180);
                          const x2 = 50 + 50 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                          const y2 = 50 + 50 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                          const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                          currentAngle += angle;
                          return (
                            <path
                              key={i}
                              d={pathData}
                              fill={item.color}
                              stroke="#1f2937"
                              strokeWidth="0.5"
                              onMouseEnter={(event) => handleProductTypeMouseEnter(item, event)}
                              onMouseMove={handleProductTypeMouseMove}
                              onMouseLeave={handleProductTypeMouseLeave}
                            />
                          );
                        });
                      })()}
                      <circle cx="50" cy="50" r="30" fill="#1f2937" />
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="fill-white text-xs font-bold">
                        100%
                      </text>
                    </svg>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  {productTypeDataState.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                        <span className="text-text-secondary">{item.name}</span>
                      </div>
                      <span className="text-text-primary font-semibold">
                        {(item.share ?? ((item.value / (totalProductTypeValue || 1)) * 100)).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-background-light p-6 rounded-lg flex flex-col">
          <h3 className="font-bold text-text-primary mb-4">
                {chartType === 'orders'
                  ? 'Number of Orders by Time'
                  : selectedMetric === 'income'
                    ? 'Income by Time'
                    : chartType === 'revenue'
                      ? 'Revenue by Time'
                      : chartType === 'profit'
                        ? 'Profit by Time'
                        : chartType === 'productsSold'
                          ? 'Products Sold by Time'
                          : 'Chart by Time'}
          </h3>
              {compareWithPrevious && (
                <div className="flex items-center gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary"></div>
                    <span className="text-text-secondary">
                      {chartDetail === 'year'
                        ? 'Current Year'
                        : chartDetail === 'month'
                          ? 'Current Month'
                          : chartDetail === 'quarter'
                            ? 'Current Quarter'
                            : 'Current Week'}
                    </span>
            </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary/40"></div>
                    <span className="text-text-secondary">
                      {chartDetail === 'year'
                        ? 'Previous Year'
                        : chartDetail === 'month'
                          ? 'Previous Month'
                          : chartDetail === 'quarter'
                            ? 'Previous Quarter'
                            : 'Previous Week'}
                    </span>
              </div>
                </div>
              )}
              <div className="flex-1 border-l border-b border-gray-700 relative px-10 py-6">
                <div className="relative w-full" style={{ height: chartInnerHeight }}>
            <div className="absolute left-0 top-0 bottom-0 -translate-x-full -ml-5 pr-6 flex flex-col justify-between text-xs text-text-secondary text-right">
                    {yAxisLabels.map((value, idx) => (
                      <span key={idx}>
                        {shouldUseK
                          ? (value >= 1 ? `${value.toFixed(value >= 10 ? 0 : 1)}k` : value.toFixed(2))
                          : value.toFixed(0)}
                      </span>
                    ))}
            </div>
                  <div className="flex h-full justify-between items-end relative gap-4">
                    {chartData.current.map((val, i) => {
                      const prevVal = chartData.previous?.[i];
                      const isHighlighted = val === Math.max(...chartData.current);
                      const currentHeightPx = Math.max((val / maxValueK) * chartInnerHeight, 4);
                      const previousHeightPx = prevVal ? Math.max((prevVal / maxValueK) * chartInnerHeight, 4) : 0;
                      
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative group min-w-[36px]">
                          <div className="flex items-end gap-1 w-full justify-center relative">
                            <div
                              className={`rounded-t-md transition-all duration-300 cursor-pointer relative ${
                                isHighlighted
                                  ? 'bg-primary shadow-lg shadow-primary/50'
                                  : 'bg-primary hover:bg-primary/90'
                              }`}
                              style={{
                                height: `${currentHeightPx}px`,
                                width: compareWithPrevious ? '30%' : '40%',
                                minHeight: '4px',
                              }}
                              title={`${chartData.labels[i]}: ${
                                shouldUseK ? `${val.toFixed(val >= 10 ? 0 : 1)}k` : val.toFixed(0)
                              }`}
                            >
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-text-primary whitespace-nowrap z-10">
                                {shouldUseK ? `${val.toFixed(val >= 10 ? 0 : 1)}k` : val.toFixed(0)}
              </div>
                            </div>
                            {compareWithPrevious && prevVal && (
                              <div
                                className="bg-primary/40 rounded-t-md transition-all duration-300 cursor-pointer hover:bg-primary/60 relative"
                                style={{
                                  height: `${previousHeightPx}px`,
                                  width: '30%',
                                  minHeight: '4px',
                                }}
                                title={`${chartData.labels[i]} (previous period): ${
                                  shouldUseK
                                    ? `${prevVal.toFixed(prevVal >= 10 ? 0 : 1)}k`
                                    : prevVal.toFixed(0)
                                }`}
                              >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-text-secondary whitespace-nowrap z-10">
                                  {shouldUseK ? `${prevVal.toFixed(prevVal >= 10 ? 0 : 1)}k` : prevVal.toFixed(0)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {chartData.labels.length > 0 && (
                <div className="flex justify-between gap-4 px-6 mt-4">
                  {chartData.labels.map((label, idx) => (
                    <span
                      key={`chart-label-${idx}`}
                      className="text-xs text-text-secondary text-center flex-1 leading-tight break-words"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
      </div>
          )}
        </div>

        {/* Detail Data Table */}
        <div className="bg-background-light p-6 rounded-lg">
          <h3 className="font-bold text-text-primary mb-4">Detail Data</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                {chartType === 'productTypes' ? (
                  <tr className="border-b border-dashed border-gray-700 text-sm text-text-secondary uppercase tracking-wide">
                    <th className="p-3 text-left text-text-secondary">Category</th>
                    <th className="p-3 text-left text-text-secondary">Brand</th>
                    <th className="p-3 text-left text-text-secondary">Product</th>
                    <th className="p-3 text-center text-text-secondary">Qty Sold</th>
                    <th className="p-3 text-center text-text-secondary">Revenue</th>
                    <th className="p-3 text-center text-text-secondary">Share (%)</th>
                  </tr>
                ) : chartType === 'productsSold' ? (
                  <tr className="border-b border-gray-700 text-sm text-text-secondary">
                    <th className="p-3 text-center">Time Period</th>
                    <th className="p-3 text-center">Total Products Sold</th>
                    <th className="p-3 text-center">Avg per Order</th>
                    <th className="p-3 text-center">Top Product</th>
                  </tr>
                ) : selectedMetric === 'orders' ? (
                  <tr className="border-b border-gray-700 text-sm text-text-secondary">
                    <th className="p-3 text-center">Time Period</th>
                    <th className="p-3 text-center">Orders</th>
                    <th className="p-3 text-center">Growth %</th>
                    <th className="p-3 text-center">Completed</th>
                    <th className="p-3 text-center">Pending</th>
                    <th className="p-3 text-center">Cancelled</th>
                  </tr>
                ) : selectedMetric === 'sales' ? (
                  <tr className="border-b border-gray-700 text-sm text-text-secondary">
                    <th className="p-3 text-center">Time Period</th>
                    <th className="p-3 text-center">Revenue</th>
                    <th className="p-3 text-center">Avg Order Value</th>
                    <th className="p-3 text-center">Discount Used</th>
                    <th className="p-3 text-center">Growth %</th>
                  </tr>
                ) : selectedMetric === 'profit' ? (
                  <tr className="border-b border-gray-700 text-sm text-text-secondary">
                    <th className="p-3 text-center">Time Period</th>
                    <th className="p-3 text-center">Profit</th>
                    <th className="p-3 text-center">Profit Margin %</th>
                    <th className="p-3 text-center">Revenue</th>
                    <th className="p-3 text-center">Cost</th>
                    <th className="p-3 text-center">Growth %</th>
                  </tr>
                ) : selectedMetric === 'income' ? (
                  <tr className="border-b border-gray-700 text-sm text-text-secondary">
                    <th className="p-3 text-center">Time Period</th>
                    <th className="p-3 text-center">Net Income</th>
                    <th className="p-3 text-center">Discount Value</th>
                    <th className="p-3 text-center">Orders</th>
                    <th className="p-3 text-center">Growth %</th>
                  </tr>
                ) : (
                  <tr className="border-b border-gray-700 text-sm text-text-secondary">
                    <th className="p-3 text-center">Time Period</th>
                    <th className="p-3 text-center">Revenue</th>
                    <th className="p-3 text-center">Profit</th>
                    <th className="p-3 text-center">Orders</th>
                    <th className="p-3 text-center">Products Sold</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {chartType === 'productTypes' ? (
                  productTypeDetailRows.length === 0 ? (
                    <tr>
                      <td className="p-3 text-center text-text-secondary" colSpan={6}>
                        No category detail available.
                      </td>
                    </tr>
                  ) : (
                    productTypeDetailRows.map((row, index) => (
                      <tr
                        key={`${row.category}-${row.product}-${index}`}
                        className="border-b border-dashed border-gray-800 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="p-3 text-left text-text-primary font-semibold">{row.category}</td>
                        <td className="p-3 text-left text-text-primary">{row.brand}</td>
                        <td className="p-3 text-left text-text-primary">{row.product}</td>
                        <td className="p-3 text-center text-text-primary">
                          {row.quantity.toLocaleString('en-US')}
                        </td>
                        <td className="p-3 text-center text-text-primary">{formatAmount(row.revenue)}</td>
                        <td className="p-3 text-center text-text-primary">{row.sharePercent.toFixed(1)}%</td>
                      </tr>
                    ))
                  )
                ) : chartType === 'productsSold' ? (
                  tableDataState.length === 0 ? (
                    <tr>
                      <td className="p-3 text-center text-text-secondary" colSpan={4}>
                        No product quantity detail available.
                      </td>
                    </tr>
                  ) : (
                    tableDataState.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-3 text-center text-text-primary font-medium">{row.period}</td>
                        <td className="p-3 text-center text-text-primary">
                          {row.productsSold.toLocaleString('en-US')}
                        </td>
                        <td className="p-3 text-center text-text-primary">
                          {(row.avgProductsPerOrder || 0).toFixed(1)}
                        </td>
                        <td className="p-3 text-center text-text-primary">{row.topProduct}</td>
                      </tr>
                    ))
                  )
                ) : tableDataState.length === 0 ? (
                  <tr>
                    <td
                      className="p-3 text-center text-text-secondary"
                      colSpan={
                        selectedMetric === 'orders'
                          ? 6
                          : selectedMetric === 'sales'
                            ? 5
                            : selectedMetric === 'profit'
                              ? 6
                              : selectedMetric === 'income'
                                ? 5
                                : 5
                      }
                    >
                      No detail data available for this selection.
                    </td>
                  </tr>
                ) : (
                  tableDataState.map((row, i) => {
                    if (selectedMetric === 'orders') {
                      const growthClass =
                        row.ordersGrowthPercent >= 0 ? 'text-green-400' : 'text-red-400';
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-3 text-text-primary font-medium text-center">{row.period}</td>
                          <td className="p-3 text-text-primary text-center">
                            {row.orders.toLocaleString('en-US')}
                          </td>
                          <td className={`p-3 font-semibold text-center ${growthClass}`}>
                            {row.ordersGrowthPercent >= 0 ? '+' : ''}
                            {row.ordersGrowthPercent.toFixed(1)}%
                          </td>
                          <td className="p-3 text-text-primary text-center">{row.completedOrders}</td>
                          <td className="p-3 text-text-primary text-center">{row.pendingOrders}</td>
                          <td className="p-3 text-text-primary text-center">{row.cancelledOrders}</td>
                        </tr>
                      );
                    }

                    if (selectedMetric === 'sales') {
                      const growthClass =
                        row.revenueGrowthPercent >= 0 ? 'text-green-400' : 'text-red-400';
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-3 text-text-primary font-medium text-center">{row.period}</td>
                          <td className="p-3 text-text-primary text-center">{formatAmount(row.revenue)}</td>
                          <td className="p-3 text-text-primary text-center">{formatAmount(row.avgOrderValue)}</td>
                          <td className="p-3 text-text-primary text-center">{formatAmount(row.discountUsed)}</td>
                          <td className={`p-3 font-semibold text-center ${growthClass}`}>
                            {row.revenueGrowthPercent >= 0 ? '+' : ''}
                            {row.revenueGrowthPercent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    }

                    if (selectedMetric === 'profit') {
                      const growthClass =
                        row.profitGrowthPercent >= 0 ? 'text-green-400' : 'text-red-400';
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-3 text-center text-text-primary font-medium">{row.period}</td>
                          <td className="p-3 text-center text-text-primary">{formatAmount(row.profit)}</td>
                          <td className="p-3 text-center text-text-primary">
                            {row.profitMarginPercent.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center text-text-primary">{formatAmount(row.revenue)}</td>
                          <td className="p-3 text-center text-text-primary">{formatAmount(row.cost)}</td>
                          <td className={`p-3 text-center font-semibold ${growthClass}`}>
                            {row.profitGrowthPercent >= 0 ? '+' : ''}
                            {row.profitGrowthPercent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    }

                    if (selectedMetric === 'income') {
                      const growthClass =
                        row.incomeGrowthPercent >= 0 ? 'text-green-400' : 'text-red-400';
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-3 text-center text-text-primary font-medium">{row.period}</td>
                          <td className="p-3 text-center text-text-primary">{formatAmount(row.income)}</td>
                          <td className="p-3 text-center text-text-primary">{formatAmount(row.discountUsed)}</td>
                          <td className="p-3 text-center text-text-primary">
                            {row.orders.toLocaleString('en-US')}
                          </td>
                          <td className={`p-3 text-center font-semibold ${growthClass}`}>
                            {row.incomeGrowthPercent >= 0 ? '+' : ''}
                            {row.incomeGrowthPercent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={i}
                        className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-3 text-text-primary font-medium text-center">{row.period}</td>
                        <td className="p-3 text-text-primary text-center whitespace-nowrap">{formatAmount(row.revenue)}</td>
                        <td className="p-3 text-text-primary text-center whitespace-nowrap">{formatAmount(row.profit)}</td>
                        <td className="p-3 text-text-primary text-center">
                          {row.orders.toLocaleString('en-US')}
                        </td>
                        <td className="p-3 text-text-primary text-center">
                          {row.productsSold.toLocaleString('en-US')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {productTypeTooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ top: productTypeTooltip.position.y, left: productTypeTooltip.position.x }}
        >
          <div className="bg-gray-900/95 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl min-w-[200px]">
            <p className="text-sm font-semibold text-emerald-300">{productTypeTooltip.name}</p>
            <p className="text-xs text-amber-300 mt-2">
              Qty:{' '}
              <span className="text-white font-semibold">
                {productTypeTooltip.quantity.toLocaleString('en-US')}
              </span>
            </p>
            <p className="text-xs text-amber-300 mt-1">
              Revenue:{' '}
              <span className="text-white font-semibold">
                {formatAmount(productTypeTooltip.revenue)}
              </span>
            </p>
            {productTypeTooltip.topBrand && productTypeTooltip.topBrand !== '—' && (
              <p className="text-xs text-green-300 mt-1">
                Top Brand:{' '}
                <span className="text-white font-semibold">{productTypeTooltip.topBrand}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdvancedAnalyticsSection;
