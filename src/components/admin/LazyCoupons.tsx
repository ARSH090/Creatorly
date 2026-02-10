'use client';

import dynamic from 'next/dynamic';

const CouponsManagement = dynamic(() => import('./CouponsManagement').then(m => m.CouponsManagement), {
    ssr: false,
    loading: () => <div className="p-8"><div className="w-full h-[600px] animate-pulse bg-zinc-100 rounded-3xl" /></div>
});

export default CouponsManagement;
