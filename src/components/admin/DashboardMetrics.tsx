'use client';

import React from 'react';
import { Users, DollarSign, Activity, Server } from 'lucide-react';

export default function AdminDashboardMetrics() {
  const metrics = [
    {
      label: 'Total Creators',
      value: '12,450',
      change: '+15%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      label: 'Platform Revenue',
      value: '₹4.2Cr',
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-50'
    },
    {
      label: 'Active Sessions',
      value: '1,240',
      change: '-2%',
      trend: 'down',
      icon: Activity,
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      label: 'Server Health',
      value: '99.9%',
      change: 'Stable',
      trend: 'flat',
      icon: Server,
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${metric.bg}`}>
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${metric.trend === 'up' ? 'bg-green-100 text-green-700' :
                metric.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
              }`}>
              {metric.change}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</p>
          <p className="text-sm text-gray-500 font-medium">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}
