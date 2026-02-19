// @ts-nocheck
import AdminDashboardMetrics from '@/components/admin/DashboardMetrics';
import GrowthTrendCard from '@/components/admin/GrowthTrendCard';
import UserManagement from '@/components/admin/UserManagement';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/server-auth';
import { redirect } from 'next/navigation';
import { getSecurityEventsDB } from '@/lib/security/monitoring';

export const dynamic = 'force-dynamic';

function formatRelativeTime(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    redirect('/auth/login');
  }

  const adminName = user.displayName || 'Admin';
  const adminEmail = user.email || '';

  // Fetch real security events
  const securityEvents = await getSecurityEventsDB({}, 6);

  return (
    <div className="min-h-screen bg-gray-950 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <Shield className="w-8 h-8 text-indigo-500" />
              ADMIN CONSOLE
            </h1>
            <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest">
              Platform status & surveillance â€¢ Version 2.0.4
            </p>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900/50 p-2 pl-4 rounded-2xl border border-white/5">
            <div className="text-right">
              <p className="text-sm font-black text-white tracking-tight">{adminName}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{adminEmail}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
              {adminName.charAt(0)}
            </div>
          </div>
        </header>

        <AdminDashboardMetrics />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Alerts */}
          <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <AlertTriangle className="w-24 h-24 text-amber-500" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tighter italic">
                <div className="w-2 h-6 bg-amber-500 rounded-full" />
                Active Security Feed
              </h2>
              <div className="space-y-4">
                {securityEvents.length > 0 ? securityEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer group/item"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 animate-pulse ${event.severity === 'critical' ? 'bg-rose-500' :
                      event.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400'
                      }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-white group-hover/item:text-indigo-300 transition-colors uppercase tracking-tight">
                          {event.eventType.replace(/_/g, ' ')}
                        </p>
                        <span className="text-[10px] font-black text-zinc-600 group-hover/item:text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                          {formatRelativeTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium mt-1 line-clamp-1 opacity-80">
                        {event.ipAddress} â€¢ {JSON.stringify(event.context).slice(0, 50)}...
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">No active threats detected</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <TrendingUp className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tighter italic">
                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                Growth Trajectory
              </h2>
              <GrowthTrendCard />
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <section className="space-y-6">
          <UserManagement />
        </section>
      </div>
    </div>
  );
}
