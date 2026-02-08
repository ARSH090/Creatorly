'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Package, ShoppingCart, Clock, AlertTriangle, Ticket } from 'lucide-react';

interface MetricsData {
  users: { total: number; creators: number; regular: number };
  products: { active: number };
  orders: { today: number; week: number; month: number };
  revenue: { today: number; week: number; month: number; allTime: number; platformCommission: number };
  payouts: { pending: number };
  subscriptions: { active: number };
  conversion: { rate: number; purchasingUsers: number };
  averageOrderValue: number;
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
      const response = await fetch('/api/admin/dashboard/metrics');
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-800 h-32 rounded-xl animate-pulse border border-gray-700"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3">
        <AlertTriangle size={20} className="text-red-500" />
        <span className="font-medium">Connectivity Error: {error}</span>
      </div>
    );
  }

  if (!metrics) return null;

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const metricCards = [
    {
      title: 'Total Revenue',
      value: formatINR(metrics.revenue.allTime),
      icon: TrendingUp,
      color: 'blue',
      trend: 'All-time platform volume',
    },
    {
      title: 'Active Creators',
      value: metrics.users.creators.toString(),
      icon: Users,
      color: 'green',
      trend: 'Verified store owners',
    },
    {
      title: 'Total Products',
      value: metrics.products.active.toString(),
      icon: Package,
      color: 'purple',
      trend: 'Live listings',
    },
    {
      title: 'Orders Today',
      value: metrics.orders.today.toString(),
      icon: ShoppingCart,
      color: 'orange',
      trend: `${metrics.orders.week} this week`,
    },
    {
      title: 'Avg Order Value',
      value: formatINR(metrics.averageOrderValue),
      icon: TrendingUp,
      color: 'pink',
      trend: 'Across all listings',
    },
    {
      title: 'Platform Earnings',
      value: formatINR(metrics.revenue.platformCommission),
      icon: TrendingUp,
      color: 'blue',
      trend: '5% platform fee total',
    },
    {
      title: 'Pending Payouts',
      value: formatINR(metrics.payouts.pending),
      icon: Clock,
      color: 'yellow',
      trend: 'Creator payments due',
    },
    {
      title: 'Active Subs',
      value: metrics.subscriptions.active.toString(),
      icon: Ticket,
      color: 'indigo',
      trend: 'Creatorly Pro users',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const colorClass = colorMap[metric.color] || 'bg-gray-500/10 border-gray-500/20 text-gray-400';

          return (
            <div key={index} className={`${colorClass} border rounded-2xl p-6 transition-all hover:scale-[1.02]`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">{metric.title}</p>
                  <p className="text-2xl font-black tracking-tight">{metric.value}</p>
                  <p className="text-[10px] font-medium opacity-50 mt-2">{metric.trend}</p>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <TrendingUp size={16} /> Platform Conversion
          </h3>
          <div className="flex items-end gap-4 mb-4">
            <span className="text-5xl font-black tracking-tighter text-white">{metrics.conversion.rate}%</span>
            <span className="text-sm font-medium text-gray-500 pb-2">of visitors convert to customers</span>
          </div>
          <p className="text-xs text-gray-500">Based on {metrics.conversion.purchasingUsers} purchasing users found in database.</p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <Users size={16} /> User Base Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/30">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Creators</p>
              <p className="text-2xl font-bold text-white">{metrics.users.creators}</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/30">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Customers</p>
              <p className="text-2xl font-bold text-white">{metrics.users.regular}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
