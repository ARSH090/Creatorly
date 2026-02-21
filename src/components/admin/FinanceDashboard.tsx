'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Clock, CheckCircle, AlertTriangle, ShieldCheck, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
    if (selectedPayouts.length === 0) return;
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
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] animate-pulse">Querying Financial Core</p>
        </div>
      </div>
    );
  }

  const monthlyMetrics = metrics?.monthly || {};
  const yearlyMetrics = metrics?.yearly || {};

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
            <IndianRupee className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
            FINANCIAL INTELLIGENCE
          </h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
            Real-time Liquidity • Settlement Engine Active
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Flux"
          value={`₹${(monthlyMetrics.grossRevenue || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="text-indigo-400"
          bgColor="bg-indigo-500/10"
          trend={`${monthlyMetrics.orders || 0} Txs`}
        />
        <MetricCard
          title="Platform Yield"
          value={`₹${(monthlyMetrics.platformCommission || 0).toLocaleString()}`}
          icon={ShieldCheck}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          trend={`${(((monthlyMetrics.platformCommission || 0) / (monthlyMetrics.grossRevenue || 1)) * 100).toFixed(1)}% MARGIN`}
        />
        <MetricCard
          title="Creator Payouts"
          value={`₹${(monthlyMetrics.creatorEarnings || 0).toLocaleString()}`}
          icon={PieChart}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          trend="DISTRIBUTED"
        />
        <MetricCard
          title="Pending Settlement"
          value={`₹${(metrics?.payouts?.pending?.amount || 0).toLocaleString()}`}
          icon={Clock}
          color="text-rose-400"
          bgColor="bg-rose-500/10"
          trend={`${metrics?.payouts?.pending?.count || 0} QUEUED`}
        />
      </div>

      {/* Yearly Summary */}
      <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-colors" />
        <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter italic">
          <div className="w-2 h-8 bg-indigo-500 rounded-full" />
          ANNUAL CONSOLIDATION
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-2 p-6 bg-black/20 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Gross Aggregate</p>
            <p className="text-3xl font-black text-white tracking-tighter italic">
              ₹{(yearlyMetrics.grossRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="space-y-2 p-6 bg-black/20 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Transaction Volume</p>
            <p className="text-3xl font-black text-white tracking-tighter italic">{yearlyMetrics.orders || 0}</p>
          </div>
          <div className="space-y-2 p-6 bg-black/20 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Platform Net</p>
            <p className="text-3xl font-black text-white tracking-tighter italic">
              ₹{(yearlyMetrics.platformCommission || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-2xl font-black text-white flex items-center gap-4 uppercase tracking-tighter italic">
            <div className="w-2 h-8 bg-emerald-500 rounded-full" />
            PENDING SETTLEMENTS
          </h3>
          <button
            onClick={handleProcessPayouts}
            disabled={selectedPayouts.length === 0 || processingPayouts}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-3"
          >
            {processingPayouts ? (
              <Clock className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {processingPayouts ? 'EXECUTING...' : `AUTHORIZE ${selectedPayouts.length || ''}`}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 border-b border-white/5">
                <th className="px-10 py-6">
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
                    className="w-5 h-5 rounded-lg border-white/10 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                </th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entity</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amount</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">No Pending Transactions</p>
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-8">
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
                        className="w-5 h-5 rounded-lg border-white/10 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                    </td>
                    <td className="px-10 py-8">
                      <div>
                        <p className="text-white font-black uppercase italic tracking-tight underline decoration-indigo-500/50 decoration-2 underline-offset-4">
                          {payout.creatorId.displayName}
                        </p>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-tighter mt-1">{payout.creatorId.email}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-xl font-black text-white tracking-tighter italic">₹{payout.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {new Date(payout.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
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
  color,
  bgColor,
  trend,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
  trend: string | number;
}) {
  return (
    <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 ${bgColor} blur-[60px] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={`p-4 ${bgColor} rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-white tracking-tighter italic group-hover:translate-x-1 transition-transform">{value}</p>
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-2 ml-1">{title}</p>
      </div>
      {trend && (
        <div className="mt-6 flex items-center gap-2 relative z-10">
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{trend}</span>
          </div>
        </div>
      )}
    </div>
  );
}
