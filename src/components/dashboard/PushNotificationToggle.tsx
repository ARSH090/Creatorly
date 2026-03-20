'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PushNotificationToggle() {
    const [supported, setSupported] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSupported('serviceWorker' in navigator && 'PushManager' in window);
        // Check if already subscribed
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                reg.pushManager.getSubscription().then((sub) => {
                    setSubscribed(!!sub);
                });
            });
        }
    }, []);

    if (!supported) return null;

    const subscribe = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error('Notification permission denied. Enable in browser settings.');
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });

            await fetch('/api/notifications/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub),
            });

            setSubscribed(true);
            toast.success('Sale notifications enabled! You\'ll be notified instantly.');
        } catch (err: any) {
            toast.error('Failed to enable notifications: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) await sub.unsubscribe();
            await fetch('/api/notifications/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(null),
            });
            setSubscribed(false);
            toast.success('Sale notifications disabled.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={subscribed ? unsubscribe : subscribe}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                subscribed
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-indigo-500/50 hover:text-indigo-400'
            }`}
        >
            {loading ? <Loader2 size={13} className="animate-spin" /> : subscribed ? <Bell size={13} /> : <BellOff size={13} />}
            {subscribed ? 'Sale alerts ON' : 'Enable sale alerts'}
        </button>
    );
}
