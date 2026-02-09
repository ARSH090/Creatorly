import AdminDashboardMetrics from '@/components/admin/DashboardMetrics';
import { Shield, TrendingUp } from 'lucide-react';
import { getCurrentUser } from '@/lib/firebase/server-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    redirect('/auth/login');
  }

  const adminName = user.displayName || 'Admin';
  const adminEmail = user.email || '';

  return (
    <div className="min-h-screen bg-gray-900 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-400" />
              Admin Console
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Platform-wide overview, health, and creator performance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{adminName}</p>
              <p className="text-xs text-zinc-500">{adminEmail}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              {adminName.charAt(0)}
            </div>
          </div>
        </header>

        <AdminDashboardMetrics />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Alerts */}
          <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-6">System Alerts</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-white">
                      Elevated traffic detected on Creator API
                    </p>
                    <p className="text-xs text-zinc-500">Last checked 2 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-6">Growth Trajectory</h2>
            <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-zinc-400">
              <TrendingUp className="w-8 h-8 mb-3 text-indigo-400" />
              <p className="font-medium text-sm">
                Growth chart will visualize creator and revenue trends here.
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Hook this panel to your analytics provider when ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
