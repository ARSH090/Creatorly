'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Info, AlertTriangle, MessageSquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (Array.isArray(data)) setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling as a simpler alternative to Socket.io for notifications for now
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id?: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id }),
                headers: { 'Content-Type': 'application/json' }
            });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'team_invite': return <Zap className="w-4 h-4 text-indigo-400" />;
            case 'usage_alert': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case 'content_failed': return <AlertTriangle className="w-4 h-4 text-red-400" />;
            case 'comment': return <MessageSquare className="w-4 h-4 text-blue-400" />;
            default: return <Info className="w-4 h-4 text-zinc-400" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-zinc-900" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAsRead()}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500 text-sm">
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group relative"
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1">
                                                    {getTypeIcon(notif.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white mb-0.5">{notif.title}</p>
                                                    <p className="text-xs text-zinc-400 leading-relaxed">{notif.message}</p>
                                                </div>
                                                <button
                                                    onClick={() => markAsRead(notif._id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-all"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
