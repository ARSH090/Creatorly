'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Container,
    Paper,
    Breadcrumbs,
    Link as MuiLink
} from '@mui/material';
import {
    BarChart as AnalyticsIcon,
    PriceCheck as PlansIcon,
    ConfirmationNumber as CouponsIcon,
    History as AuditIcon
} from '@mui/icons-material';
import Link from 'next/link';

import PlansManagement from '@/components/admin/subscription/PlansManagement';
import CouponsManagementEnhanced from '@/components/admin/subscription/CouponsManagementEnhanced';
import SubscriptionAnalytics from '@/components/admin/subscription/SubscriptionAnalytics';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`subscription-tabpanel-${index}`}
            aria-labelledby={`subscription-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function SubscriptionsPageContent() {
    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                    <Link href="/admin/dashboard" passHref style={{ textDecoration: 'none' }}>
                        <MuiLink underline="hover" color="inherit">Admin</MuiLink>
                    </Link>
                    <Typography color="text.primary">Subscriptions</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="bold">Subscription Management</Typography>
            </Box>

            <Paper sx={{ width: '100%', borderRadius: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tabs value={value} onChange={handleChange} aria-label="subscription tabs">
                        <Tab icon={<AnalyticsIcon />} iconPosition="start" label="Analytics" />
                        <Tab icon={<PlansIcon />} iconPosition="start" label="Plans" />
                        <Tab icon={<CouponsIcon />} iconPosition="start" label="Coupons" />
                        <Tab icon={<AuditIcon />} iconPosition="start" label="Audit Log" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2 }}>
                    <CustomTabPanel value={value} index={0}>
                        <SubscriptionAnalytics />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={1}>
                        <PlansManagement />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={2}>
                        <CouponsManagementEnhanced />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={3}>
                        <Box sx={{ p: 5, textAlign: 'center' }}>
                            <AuditIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">Audit Logs</Typography>
                            <Typography variant="body2" color="text.disabled">
                                Comprehensive tracking of all price changes, coupon creations, and subscription updates.
                            </Typography>
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'left' }}>
                                <Typography variant="caption" display="block" color="text.secondary">RECENT ACTIVITY (STUB):</Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>• <b>Admin</b> created plan "Pro Creator" [2 mins ago]</Typography>
                                <Typography variant="body2">• <b>Admin</b> deactivated coupon "SUMMER50" [1 hour ago]</Typography>
                                <Typography variant="body2">• <b>System</b> auto-renewed 12 subscriptions [4 hours ago]</Typography>
                            </Box>
                        </Box>
                    </CustomTabPanel>
                </Box>
            </Paper>
        </Container>
    );
}

