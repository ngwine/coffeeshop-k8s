import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { fetchOrders } from '../../../../../../api/orders';
import { formatVND } from '../../../../../../utils/currency';
import Card from '../common/Card';

const RevenueReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<number[]>([]);
  const [expenseData, setExpenseData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const startDate = new Date(selectedYear, 0, 1);
        const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
        
        const res = await fetchOrders({
          page: 1,
          limit: 10000,
          includeItems: 'true',
          range: 'custom',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const orders = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.items) ? res.items : []);

        if (cancelled) return;

        // Group orders by month
        const monthlyData: { [key: number]: { revenue: number; expense: number } } = {};
        
        for (let i = 0; i < 12; i++) {
          monthlyData[i] = { revenue: 0, expense: 0 };
        }

        orders.forEach((order: any) => {
          if (!order.createdAt) return;
          const orderDate = new Date(order.createdAt);
          const month = orderDate.getMonth();
          
          const revenue = Number(order.total) || 0;
          const discount = Number(order.discount) || 0;
          const costOfGoods = Number(order.costOfGoods) || Number(order.cost) || (revenue * 0.2);
          
          monthlyData[month].revenue += revenue - discount; // Income after discount
          monthlyData[month].expense += costOfGoods;
        });

        const revenueValues: number[] = [];
        const expenseValues: number[] = [];
        const monthLabels: string[] = [];

        for (let i = 0; i < 12; i++) {
          revenueValues.push(monthlyData[i].revenue);
          expenseValues.push(-monthlyData[i].expense); // Negative for display
          monthLabels.push(monthNames[i]);
        }

        const total = revenueValues.reduce((sum, val) => sum + val, 0);

        if (!cancelled) {
          setData(revenueValues);
          setExpenseData(expenseValues);
          setLabels(monthLabels);
          setTotalRevenue(total);
        }
      } catch (error) {
        if (!cancelled) {
          setData([]);
          setExpenseData([]);
          setLabels(monthNames);
          setTotalRevenue(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  const maxVal = Math.max(...data, ...expenseData.map(Math.abs), 1);
  const minVal = Math.min(...expenseData, 0);
  const range = maxVal - minVal;
  const yAxisSteps = 6;
  const stepValue = range / (yAxisSteps - 1);

  return (
    <Card className="col-span-1 md:col-span-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-text-primary">Revenue Report</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-sm" />
            <span className="text-text-secondary">Earning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent-yellow rounded-sm" />
            <span className="text-text-secondary">Expense</span>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-text-secondary">Loading...</p>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="w-3/4 pl-8">
            <div className="h-64 border-l border-b border-gray-700 flex justify-around items-end relative">
              <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between text-xs text-text-secondary">
                {Array.from({ length: yAxisSteps }, (_, i) => {
                  const value = maxVal - (stepValue * i);
                  return (
                    <span key={i}>
                      {value >= 0 ? formatVND(value) : formatVND(value)}
                    </span>
                  );
                })}
              </div>
              {data.map((val, idx) => {
                const expense = Math.abs(expenseData[idx]);
                const earningHeight = range > 0 ? ((val - minVal) / range) * 100 : 0;
                const expenseHeight = range > 0 ? ((expense - minVal) / range) * 100 : 0;
                return (
                  <div key={idx} className="flex flex-col items-center w-full h-full justify-end">
                    <div className="h-full w-full flex flex-col justify-end items-center">
                      <div
                        className="bg-primary rounded-t-md"
                        style={{ height: `${Math.max(earningHeight, 2)}%`, width: '40%' }}
                      />
                      <div
                        className="bg-accent-yellow rounded-b-md"
                        style={{ height: `${Math.max(expenseHeight, 2)}%`, width: '40%' }}
                      />
                    </div>
                    <span className="text-xs text-text-secondary mt-1">{labels[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="w-1/4 border-l border-gray-700 pl-4 flex flex-col justify-between">
            <div>
              <button className="w-full flex justify-between items-center bg-background-dark p-2 rounded-md text-sm hover:bg-background-dark hover:transform-none hover:shadow-none">
                {selectedYear} <ChevronDown size={16} />
              </button>
              <p className="text-3xl font-bold mt-4">{formatVND(totalRevenue)}</p>
              <p className="text-sm text-text-secondary">Total Revenue</p>
            </div>
            <div className="h-16">
              <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path
                  d="M 0 15 C 10 5, 20 25, 30 15 S 50 25, 60 15 S 80 5, 90 15, 100 20"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 0 22 C 10 12, 20 32, 30 22 S 50 32, 60 22 S 80 12, 90 22, 100 27"
                  stroke="#4b5563"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RevenueReport;





