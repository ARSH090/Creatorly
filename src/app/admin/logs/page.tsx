'use client';

import React from 'react';
import AuditLogs from '@/components/admin/AuditLogs';

export default function LogsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <AuditLogs />
        </div>
    );
}
