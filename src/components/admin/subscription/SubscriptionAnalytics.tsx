'use client';

import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    CircularProgress,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    TrendingUp,
    Group,
    ShowChart,
    AccountBalanceWallet
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function SubscriptionAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/analytics');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    const stats = [
        { title: 'Total MRR', value: `₹${data.mrr?.toLocaleString()}`, icon: <AccountBalanceWallet color="primary" />, color: 'primary.main' },
        { title: 'Active Subs', value: data.activeCount, icon: <Group color="success" />, color: 'success.main' },
        { title: 'Churn Rate', value: `${data.churnRate}%`, icon: <TrendingUp color="error" />, color: 'error.main' },
        { title: 'Growth Index', value: '1.2x', icon: <ShowChart color="info" />, color: 'info.main' },
    ];

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Subscription Insights</Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    {stat.icon}
                                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary', fontWeight: 'medium' }}>
                                        {stat.title}
                                    </Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold">
                                    {stat.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: 400 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Revenue Distribution (Monthly)</Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={data.tierStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#3f51b5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: 400 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Active Subscribers by Tier</Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <PieChart>
                                <Pie
                                    data={data.tierStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {data.tierStats?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
