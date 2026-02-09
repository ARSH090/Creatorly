'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Ticket,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import Logo from '@/components/Logo';

export interface AdminLayoutProps {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string;
  onLogout?: () => void;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    name: 'Coupons',
    href: '/admin/coupons',
    icon: Ticket,
  },
  {
    name: 'Finance',
    href: '/admin/finance',
    icon: CreditCard,
  },
  {
    name: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: Ticket,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminLayout({ children, adminName: initialName, adminEmail: initialEmail, onLogout }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const adminName = initialName || user?.displayName || 'Admin';
  const adminEmail = initialEmail || user?.email || '';

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } bg-gray-800 text-white transition-all duration-300 flex flex-col overflow-y-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && <Logo showText={true} className="text-xl" iconClassName="w-8 h-8" />}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-700 rounded">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
                  }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 space-y-3">
          {sidebarOpen && (
            <div className="text-xs">
              <p className="text-gray-400">Logged in as</p>
              <p className="text-white font-semibold truncate">{adminName}</p>
              <p className="text-gray-500 truncate">{adminEmail}</p>
            </div>
          )}
          <button
            onClick={() => onLogout ? onLogout() : logout()}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">System Online</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-900">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
