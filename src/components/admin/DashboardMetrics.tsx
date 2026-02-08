'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Package, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';

interface MetricsData {
  overview: {
    totalRevenue: number;
    totalRevenueFormatted: string;
    activeCreators: number;
    totalProducts: number;
    ordersProcessedToday: number;
    pendingPayouts: number;
    pendingPayoutsFormatted: string;
    platformConversionRate: string;
    averageOrderValue: number;
    averageOrderValueFormatted: string;
  };
  users: {
    totalUsers: number;
    activeCreators: number;
    suspendedUsers: number;
    newUsersThisMonth: number;
  };
  orders: {
    allTime: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    failed: number;
    refunded: number;
  };
  systemHealth: {
    apiResponseTime: string;
    apiUptime: string;
    databaseStatus: string;
    status: string;
  };
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.metrics);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-700 h-32 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
        <AlertTriangle size={20} />
        <span>Error loading metrics: {error}</span>
      </div>
    );
  }

  if (!metrics) return null;

  const metricCards = [
    {
      title: 'Total Revenue',
      value: metrics.overview.totalRevenueFormatted,
      icon: TrendingUp,
      color: 'blue',
      trend: '+12% from last month',
    },
    {
      title: 'Active Creators',
      value: metrics.users.activeCreators.toString(),
      icon: Users,
      color: 'green',
      trend: `+${metrics.users.newUsersThisMonth} this month`,
    },
    {
      title: 'Total Products',
      value: metrics.overview.totalProducts.toString(),
      icon: Package,
      color: 'purple',
      trend: '+5% growth',
    },
    {
      title: 'Orders Today',
      value: metrics.orders.today.toString(),
      icon: ShoppingCart,
      color: 'orange',
      trend: `${metrics.orders.thisWeek} this week`,
    },
    {
      title: 'Avg Order Value',
      value: metrics.overview.averageOrderValueFormatted,
      icon: TrendingUp,
      color: 'pink',
      trend: 'All orders',
    },
    {
      title: 'Pending Payouts',
      value: metrics.overview.pendingPayoutsFormatted,
      icon: Clock,
      color: 'yellow',
      trend: 'Action required',
    },
    {
      title: 'Failed Orders',
      value: metrics.orders.failed.toString(),
      icon: AlertTriangle,
      color: 'red',
      trend: 'Last 30 days',
    },
    {
      title: 'Suspended Users',
      value: metrics.users.suspendedUsers.toString(),
      icon: Users,
      color: 'gray',
      trend: 'Needs review',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-900 border-blue-700',
    green: 'bg-green-900 border-green-700',
    purple: 'bg-purple-900 border-purple-700',
    orange: 'bg-orange-900 border-orange-700',
    pink: 'bg-pink-900 border-pink-700',
    yellow: 'bg-yellow-900 border-yellow-700',
    red: 'bg-red-900 border-red-700',
    gray: 'bg-gray-700 border-gray-600',
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const bgColor = colorMap[metric.color];

          return (
            <div key={index} className={`${bgColor} border rounded-lg p-6 text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">{metric.title}</p>
                  <p className="text-3xl font-bold mt-2">{metric.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{metric.trend}</p>
                </div>
                <Icon size={32} className="text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded p-4">
            <p className="text-gray-400 text-sm">API Response Time</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{metrics.systemHealth.apiResponseTime}</p>
          </div>
          <div className="bg-gray-700 rounded p-4">
            <p className="text-gray-400 text-sm">API Uptime</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{metrics.systemHealth.apiUptime}</p>
          </div>
          <div className="bg-gray-700 rounded p-4">
            <p className="text-gray-400 text-sm">Database Status</p>
            <p className="text-2xl font-bold text-green-400 mt-1 capitalize">{metrics.systemHealth.databaseStatus}</p>
          </div>
          <div className="bg-gray-700 rounded p-4">
            <p className="text-gray-400 text-sm">Overall Status</p>
            <p className="text-2xl font-bold text-green-400 mt-1 capitalize">{metrics.systemHealth.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
