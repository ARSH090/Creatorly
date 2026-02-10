'use client';

import dynamic from 'next/dynamic';

const SubscriptionsPageContent = dynamic(() => import('./SubscriptionsPageContent'), {
    ssr: false,
    loading: () => <div className="p-8 space-y-4"><div className="w-full h-20 animate-pulse bg-zinc-100 rounded-2xl" /><div className="w-full h-96 animate-pulse bg-zinc-100 rounded-2xl" /></div>
});

export default SubscriptionsPageContent;
