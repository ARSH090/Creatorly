'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface BarChartProps {
    data: any[];
    dataKey: string;
    xAxisKey: string;
    barColor?: string;
    height?: number | string;
}

export default function BarChartComponent({
    data,
    dataKey,
    xAxisKey,
    barColor = "#6366f1",
    height = 400
}: BarChartProps) {
    if (!data) return null;

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={barColor} stopOpacity={1} />
                            <stop offset="100%" stopColor={barColor} stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis
                        dataKey={xAxisKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.5rem' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}
                    />
                    <Bar dataKey={dataKey} fill="url(#barGradient)" radius={[12, 12, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
