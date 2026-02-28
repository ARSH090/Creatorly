'use client';

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface PieChartProps {
    data: any[];
    dataKey: string;
    nameKey: string;
    innerRadius?: number;
    outerRadius?: number;
    height?: number | string;
}

export default function PieChartComponent({
    data,
    dataKey,
    nameKey,
    innerRadius = 80,
    outerRadius = 100,
    height = 300
}: PieChartProps) {
    if (!data) return null;

    return (
        <div style={{ width: '100%', height, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={8}
                        dataKey={dataKey}
                        nameKey={nameKey}
                        stroke="none"
                    >
                        {data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
