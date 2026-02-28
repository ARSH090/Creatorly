'use client';

import dynamic from 'next/dynamic';

const DashboardOverview = dynamic(() => import('./DashboardOverview'), {
    ssr: false,
    loading: () => <div className="p-8"><div className="w-full h-96 animate-pulse bg-gray-100 rounded-[2.5rem]" /></div>
});

export default DashboardOverview;
