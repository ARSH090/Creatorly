'use client';

import React, { useState, useEffect } from 'react';
import {
    DataGrid,
    GridColDef,
    GridActionsCellItem
} from '@mui/x-data-grid';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Typography,
    Box,
    Divider,
    Alert,
    IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ContentCopy as DuplicateIcon,
    Archive as ArchiveIcon
} from '@mui/icons-material';
import { PlanTier, BillingPeriod } from '@/lib/models/plan.types';

export default function PlansManagement() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const initialFormState = {
        name: '',
        description: '',
        tier: PlanTier.FREE,
        billingPeriod: [BillingPeriod.MONTHLY],
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxUsers: 1,
        maxStorageMb: 100,
        maxApiCalls: 1000,
        rateLimitPerMin: 10,
        hasAnalytics: false,
        hasPrioritySupport: false,
        hasCustomDomain: false,
        hasTeamCollaboration: false,
        hasWebhooks: false,
        isActive: true,
        isVisible: true,
        sortOrder: 0
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/plans');
            const data = await res.json();
            if (data.plans) setPlans(data.plans);
        } catch (err) {
            console.error('Failed to fetch plans', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (plan: any = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData(plan);
        } else {
            setEditingPlan(null);
            setFormData(initialFormState);
        }
        setError(null);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async () => {
        try {
            const method = editingPlan ? 'PUT' : 'POST';
            const url = editingPlan ? `/api/admin/plans/${editingPlan._id}` : '/api/admin/plans';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to save plan');

            handleClose();
            fetchPlans();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete or archive this plan?')) {
            try {
                const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
                const result = await res.json();
                alert(result.message);
                fetchPlans();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Name', width: 200 },
        {
            field: 'tier', headerName: 'Tier', width: 120, renderCell: (params) => (
                <Box sx={{ textTransform: 'capitalize' }}>{params.value}</Box>
            )
        },
        { field: 'monthlyPrice', headerName: 'Monthly ($)', width: 120, type: 'number' },
        { field: 'yearlyPrice', headerName: 'Yearly ($)', width: 120, type: 'number' },
        { field: 'isActive', headerName: 'Active', width: 100, type: 'boolean' },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params: any) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleOpen(params.row)}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDelete(params.id as string)}
                />,
            ],
        },
    ];

    const handleTierChange = (e: any) => {
        const tier = e.target.value;
        if (tier === PlanTier.FREE) {
            setFormData({
                ...formData,
                tier,
                monthlyPrice: 0,
                yearlyPrice: 0,
                maxUsers: 1,
                maxStorageMb: 100,
                maxApiCalls: 1000,
                hasAnalytics: false,
                hasPrioritySupport: false,
                hasCustomDomain: false,
                hasTeamCollaboration: false,
                hasWebhooks: false
            });
        } else {
            setFormData({ ...formData, tier });
        }
    };

    return (
        <Box sx={{ width: '100%', p: 2, bgcolor: '#fff', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Plans Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Create Plan
                </Button>
            </Box>

            <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={plans}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    disableRowSelectionOnClick
                />
            </div>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>Section 1: Basic Information</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth label="Plan Name" required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select fullWidth label="Tier" required
                                value={formData.tier}
                                onChange={handleTierChange}
                                disabled={editingPlan && editingPlan.tier === PlanTier.FREE}
                            >
                                {Object.values(PlanTier).map((tier) => (
                                    <MenuItem key={tier} value={tier}>{tier.toUpperCase()}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth multiline rows={2} label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}><Divider /></Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>Section 2: Pricing</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth type="number" label="Monthly Price ($)" required
                                value={formData.monthlyPrice}
                                onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                                disabled={formData.tier === PlanTier.FREE}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth type="number" label="Yearly Price ($)" required
                                value={formData.yearlyPrice}
                                onChange={(e) => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })}
                                disabled={formData.tier === PlanTier.FREE}
                                helperText="Auto-calculations: Recommend < Monthly x 12"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}><Divider /></Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>Section 3: Strict Limits</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth type="number" label="Max Users" required
                                value={formData.maxUsers}
                                onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
                                disabled={formData.tier === PlanTier.FREE}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth type="number" label="Storage (MB)" required
                                value={formData.maxStorageMb}
                                onChange={(e) => setFormData({ ...formData, maxStorageMb: Number(e.target.value) })}
                                disabled={formData.tier === PlanTier.FREE}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth type="number" label="Max API Calls/Day" required
                                value={formData.maxApiCalls}
                                onChange={(e) => setFormData({ ...formData, maxApiCalls: Number(e.target.value) })}
                                disabled={formData.tier === PlanTier.FREE}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}><Divider /></Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>Section 4: Feature Flags</Typography>
                        </Grid>
                        {[
                            { key: 'hasAnalytics', label: 'Analytics Dashboard' },
                            { key: 'hasPrioritySupport', label: 'Priority Support' },
                            { key: 'hasCustomDomain', label: 'Custom Domain' },
                            { key: 'hasTeamCollaboration', label: 'Team Collaboration' },
                            { key: 'hasWebhooks', label: 'Webhooks Access' },
                        ].map((feature) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={feature.key}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData[feature.key as keyof typeof formData] as boolean}
                                            onChange={(e) => setFormData({ ...formData, [feature.key]: e.target.checked })}
                                            disabled={formData.tier === PlanTier.FREE}
                                        />
                                    }
                                    label={feature.label}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">Save Plan</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
