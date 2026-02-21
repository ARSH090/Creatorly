'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Activity,
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
import { useClerk } from '@clerk/nextjs';

const sidebarItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/queues', label: 'Queues', icon: Activity },
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
    const { signOut } = useClerk();

    const handleLogout = () => {
        signOut({ redirectUrl: '/admin/login' });
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r border-white/5 bg-[#080808] text-white">
            <div className="flex h-20 items-center border-b border-white/5 px-6 font-black text-lg tracking-tighter uppercase italic">
                <ShieldAlert className="mr-2 h-6 w-6 text-indigo-500" />
                Creatorly <span className="text-zinc-600 ml-1 font-bold not-italic">Admin</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all uppercase tracking-widest',
                                pathname === item.href
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", pathname === item.href ? "text-white" : "text-zinc-600")} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t border-white/5 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 font-bold uppercase tracking-widest text-[10px] rounded-xl"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-3 h-4 w-4" />
                    Terminate Session
                </Button>
            </div>
        </div>
    );
}
