import React, { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { fetchOrders } from '../../../../../../api/orders';
import { formatVND } from '../../../../../../utils/currency';
import Card from '../common/Card';

const EarningReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState<Array<{ day: string; net: number; income: number; expenses: number }>>([]);
  const [totalNet, setTotalNet] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netGrowth, setNetGrowth] = useState(0);
  const [incomeGrowth, setIncomeGrowth] = useState(0);
  const [expenseGrowth, setExpenseGrowth] = useState(0);

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current week (Monday to Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Get previous week for comparison
        const prevMonday = new Date(monday);
        prevMonday.setDate(monday.getDate() - 7);
        const prevSunday = new Date(prevMonday);
        prevSunday.setDate(prevMonday.getDate() + 6);
        prevSunday.setHours(23, 59, 59, 999);

        // Fetch current week orders
        const currentRes = await fetchOrders({
          page: 1,
          limit: 10000,
          includeItems: 'true',
          range: 'custom',
          startDate: monday.toISOString(),
          endDate: sunday.toISOString(),
        });

        // Fetch previous week orders
        const prevRes = await fetchOrders({
          page: 1,
          limit: 10000,
          includeItems: 'true',
          range: 'custom',
          startDate: prevMonday.toISOString(),
          endDate: prevSunday.toISOString(),
        });

        const currentOrders = Array.isArray(currentRes?.data) ? currentRes.data : (Array.isArray(currentRes?.items) ? currentRes.items : []);
        const prevOrders = Array.isArray(prevRes?.data) ? prevRes.data : (Array.isArray(prevRes?.items) ? prevRes.items : []);

        if (cancelled) return;

        // Group current week orders by day
        const dailyData: { [key: number]: { income: number; expenses: number } } = {};
        for (let i = 0; i < 7; i++) {
          dailyData[i] = { income: 0, expenses: 0 };
        }

        currentOrders.forEach((order: any) => {
          if (!order.createdAt) return;
          const orderDate = new Date(order.createdAt);
          const dayOfWeek = orderDate.getDay();
          
          const total = Number(order.total) || 0;
          const discount = Number(order.discount) || 0;
          const costOfGoods = Number(order.costOfGoods) || Number(order.cost) || (total * 0.2);
          
          dailyData[dayOfWeek].income += total - discount;
          dailyData[dayOfWeek].expenses += costOfGoods;
        });

        // Calculate previous week totals for growth
        const prevWeekIncome = prevOrders.reduce((sum: number, o: any) => {
          const total = Number(o.total) || 0;
          const discount = Number(o.discount) || 0;
          return sum + (total - discount);
        }, 0);
        
        const prevWeekExpenses = prevOrders.reduce((sum: number, o: any) => {
          const revenue = Number(o.total) || 0;
          const costOfGoods = Number(o.costOfGoods) || Number(o.cost) || (revenue * 0.2);
          return sum + costOfGoods;
        }, 0);
        
        const prevWeekNet = prevWeekIncome - prevWeekExpenses;

        // Convert to array format (Sunday = 0, Monday = 1, etc.)
        const earningsArray = [];
        for (let i = 0; i < 7; i++) {
          const dayData = dailyData[i];
          const net = dayData.income - dayData.expenses;
          earningsArray.push({
            day: dayNames[i],
            net,
            income: dayData.income,
            expenses: dayData.expenses,
          });
        }

        // Calculate totals
        const totalNetValue = earningsArray.reduce((sum, e) => sum + e.net, 0);
        const totalIncomeValue = earningsArray.reduce((sum, e) => sum + e.income, 0);
        const totalExpensesValue = earningsArray.reduce((sum, e) => sum + e.expenses, 0);

        // Calculate growth percentages
        const netGrowthValue = prevWeekNet !== 0 ? ((totalNetValue - prevWeekNet) / Math.abs(prevWeekNet)) * 100 : 0;
        const incomeGrowthValue = prevWeekIncome !== 0 ? ((totalIncomeValue - prevWeekIncome) / prevWeekIncome) * 100 : 0;
        const expenseGrowthValue = prevWeekExpenses !== 0 ? ((totalExpensesValue - prevWeekExpenses) / prevWeekExpenses) * 100 : 0;

        if (!cancelled) {
          setEarnings(earningsArray);
          setTotalNet(totalNetValue);
          setTotalIncome(totalIncomeValue);
          setTotalExpenses(totalExpensesValue);
          setNetGrowth(netGrowthValue);
          setIncomeGrowth(incomeGrowthValue);
          setExpenseGrowth(expenseGrowthValue);
        }
      } catch (error) {
        if (!cancelled) {
          setEarnings([]);
          setTotalNet(0);
          setTotalIncome(0);
          setTotalExpenses(0);
          setNetGrowth(0);
          setIncomeGrowth(0);
          setExpenseGrowth(0);
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
  }, []);

  const maxVal = Math.max(...earnings.map((entry) => entry.income), 1);

  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Earning Reports</h3>
          <p className="text-sm text-text-secondary">Weekly Earnings Overview</p>
        </div>
        <MoreHorizontal className="text-text-secondary cursor-pointer" />
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32 mt-4">
          <p className="text-text-secondary">Loading...</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-sm" /> Net Profit
              </div>
              <div className="font-bold">
                {formatVND(totalNet)}{' '}
                <span className={`text-xs font-normal ${netGrowth >= 0 ? 'text-accent-green' : 'text-red-400'}`}>
                  {netGrowth >= 0 ? '▲' : '▼'} {Math.abs(netGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm" /> Total Income
              </div>
              <div className="font-bold">
                {formatVND(totalIncome)}{' '}
                <span className={`text-xs font-normal ${incomeGrowth >= 0 ? 'text-accent-green' : 'text-red-400'}`}>
                  {incomeGrowth >= 0 ? '▲' : '▼'} {Math.abs(incomeGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-700 rounded-sm" /> Total Expenses
              </div>
              <div className="font-bold">
                {formatVND(totalExpenses)}{' '}
                <span className={`text-xs font-normal ${expenseGrowth >= 0 ? 'text-accent-green' : 'text-red-400'}`}>
                  {expenseGrowth >= 0 ? '▲' : '▼'} {Math.abs(expenseGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="h-32 mt-4 flex justify-around items-end gap-2">
            {earnings.map((entry) => (
              <div key={entry.day} className="flex flex-col items-center w-full h-full justify-end">
                <div
                  className="bg-primary rounded-md w-3/4"
                  style={{ height: `${Math.max((entry.net / maxVal) * 100, 2)}%` }}
                />
                <span className="text-xs text-text-secondary mt-1">{entry.day}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default EarningReports;

