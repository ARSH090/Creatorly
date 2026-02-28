'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartProps {
    data: any[];
    dataKey: string;
    xAxisKey: string;
    color?: string;
    height?: number | string;
}

export default function AreaChartComponent({
    data,
    dataKey,
    xAxisKey,
    color = "#6366f1",
    height = 100
}: AreaChartProps) {
    if (!data) return null;

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis
                        dataKey={xAxisKey}
                        hide
                    />
                    <YAxis
                        hide
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        fillOpacity={1}
                        fill="url(#colorArea)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
