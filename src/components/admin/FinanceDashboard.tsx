'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface FinanceMetrics {
  monthly: Record<string, any>;
  yearly: Record<string, any>;
  payouts: Record<string, any>;
}

interface Payout {
  _id: string;
  amount: number;
  status: string;
  creatorId: { displayName: string; email: string };
  createdAt: string;
}

export function FinanceDashboard() {
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayouts, setProcessingPayouts] = useState(false);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [metricsRes, payoutsRes] = await Promise.all([
        fetch('/api/admin/finance'),
        fetch('/api/admin/payouts?status=pending'),
      ]);

      const metricsData = await metricsRes.json();
      const payoutsData = await payoutsRes.json();

      setMetrics(metricsData.metrics);
      setPayouts(payoutsData.payouts);
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayouts = async () => {
    if (selectedPayouts.length === 0) {
      alert('Please select payouts to process');
      return;
    }

    if (!confirm(`Process ${selectedPayouts.length} payouts?`)) return;

    try {
      setProcessingPayouts(true);
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutIds: selectedPayouts,
          status: 'approved',
        }),
      });

      if (res.ok) {
        setSelectedPayouts([]);
        fetchFinanceData();
      }
    } catch (error) {
      console.error('Failed to process payouts:', error);
    } finally {
      setProcessingPayouts(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  const monthlyMetrics = metrics?.monthly || {};
  const yearlyMetrics = metrics?.yearly || {};

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Finance Dashboard</h2>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Revenue"
          value={`₹${(monthlyMetrics.grossRevenue || 0).toLocaleString()}`}
          icon={IndianRupee}
          trend={monthlyMetrics.orders}
        />
        <MetricCard
          title="Platform Commission"
          value={`₹${(monthlyMetrics.platformCommission || 0).toLocaleString()}`}
          icon={TrendingUp}
          trend={`${(((monthlyMetrics.platformCommission || 0) / (monthlyMetrics.grossRevenue || 1)) * 100).toFixed(1)}%`}
        />
        <MetricCard
          title="Creator Earnings"
          value={`₹${(monthlyMetrics.creatorEarnings || 0).toLocaleString()}`}
          icon={IndianRupee}
          trend={monthlyMetrics.orders}
        />
        <MetricCard
          title="Pending Payouts"
          value={`₹${(metrics?.payouts?.pending?.amount || 0).toLocaleString()}`}
          icon={Clock}
          trend={metrics?.payouts?.pending?.count}
        />
      </div>

      {/* Yearly Summary */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Yearly Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-white">
              ₹{(yearlyMetrics.grossRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-white">{yearlyMetrics.orders || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Platform Commission</p>
            <p className="text-2xl font-bold text-white">
              ₹{(yearlyMetrics.platformCommission || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Pending Payouts</h3>
          <button
            onClick={handleProcessPayouts}
            disabled={selectedPayouts.length === 0 || processingPayouts}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded transition"
          >
            {processingPayouts ? 'Processing...' : 'Process Selected'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPayouts.length === payouts.length && payouts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayouts(payouts.map((p) => p._id));
                      } else {
                        setSelectedPayouts([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                  Creator
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                    No pending payouts
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-700 transition">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPayouts.includes(payout._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPayouts([...selectedPayouts, payout._id]);
                          } else {
                            setSelectedPayouts(
                              selectedPayouts.filter((id) => id !== payout._id)
                            );
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="text-white font-medium">
                          {payout.creatorId.displayName}
                        </p>
                        <p className="text-gray-400 text-xs">{payout.creatorId.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      ₹{payout.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  trend: any;
}) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
        </div>
        <Icon className="text-blue-500" size={32} />
      </div>
      {trend && (
        <p className="text-gray-400 text-sm mt-3">
          {typeof trend === 'number' ? `${trend} items` : trend}
        </p>
      )}
    </div>
  );
}
