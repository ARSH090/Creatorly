'use client';

import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Activity, Server, Loader2 } from 'lucide-react';

export default function AdminDashboardMetrics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/dashboard/metrics');
        const json = await res.json();
        if (json.metrics) setData(json.metrics);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900 animate-pulse rounded-xl p-6 border border-white/5 h-32 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-zinc-700 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Creators',
      value: data?.users?.creators?.toLocaleString() || '0',
      change: '+15%', // Trend calculation could be added to API
      trend: 'up',
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10'
    },
    {
      label: 'Monthly Revenue',
      value: `₹${(data?.revenue?.month || 0).toLocaleString()}`,
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    {
      label: 'Active Subs',
      value: data?.subscriptions?.active?.toLocaleString() || '0',
      change: 'Stable',
      trend: 'flat',
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    },
    {
      label: 'Server Health',
      value: '99.9%',
      change: 'Stable',
      trend: 'flat',
      icon: Server,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, i) => (
        <div key={i} className="bg-zinc-900 rounded-xl p-6 border border-white/10 shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${metric.bg}`}>
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${metric.trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
              metric.trend === 'down' ? 'bg-rose-500/20 text-rose-400' :
                'bg-zinc-500/20 text-zinc-400'
              }`}>
              {metric.change}
            </span>
          </div>
          <p className="text-3xl font-black text-white tracking-tight mb-1">{metric.value}</p>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}
