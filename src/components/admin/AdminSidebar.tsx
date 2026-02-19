'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    CreditCard,
    Ticket,
    Banknote,
    Settings,
    ShieldAlert,
    Globe,
    LogOut,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

const sidebarItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/products', label: 'Products', icon: ShoppingBag },
    { href: '/admin/orders', label: 'Orders', icon: CreditCard },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/payouts', label: 'Payouts', icon: Banknote },
    { href: '/admin/domains', label: 'Domains', icon: Globe },
    { href: '/admin/logs', label: 'Audit Logs', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    const handleLogout = () => {
        signOut({ callbackUrl: '/admin/login' });
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-50">
            <div className="flex h-14 items-center border-b border-slate-800 px-6 font-bold text-lg tracking-tight">
                <ShieldAlert className="mr-2 h-5 w-5 text-indigo-400" />
                Creatorly Admin
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                pathname === item.href
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t border-slate-800 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:bg-slate-800 hover:text-red-300"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
