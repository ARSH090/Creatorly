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
    Chip,
    Alert,
    Autocomplete
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LocalOffer as CouponIcon
} from '@mui/icons-material';

export default function CouponsManagementEnhanced() {
    const [coupons, setCoupons] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);

    const initialFormState = {
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        appliesTo: 'all_plans',
        applicableTiers: [],
        applicablePlanIds: [],
        maxUses: 100,
        maxUsesPerUser: 1,
        minimumPurchaseAmount: 0,
        minimumPlanTier: null,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cannotCombineWithOtherCoupons: true,
        excludeDiscountedItems: false,
        isActive: true
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchCoupons();
        fetchPlans();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (data.coupons) setCoupons(data.coupons);
        } catch (err) {
            console.error('Failed to fetch coupons', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        const res = await fetch('/api/admin/plans');
        const data = await res.json();
        if (data.plans) setPlans(data.plans.filter((p: any) => p.tier !== 'free'));
    };

    const handleOpen = (coupon: any = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                ...coupon,
                validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
                validUntil: new Date(coupon.validUntil).toISOString().split('T')[0]
            });
        } else {
            setEditingCoupon(null);
            setFormData(initialFormState);
        }
        setError(null);
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        try {
            const method = editingCoupon ? 'PUT' : 'POST';
            const url = '/api/admin/coupons';

            const payload = {
                ...formData,
                id: editingCoupon?._id
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to save coupon');

            handleClose();
            fetchCoupons();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const columns: GridColDef[] = [
        { field: 'code', headerName: 'Code', width: 150, renderCell: (p) => <Typography fontWeight="bold" color="primary">{p.value}</Typography> },
        { field: 'discountType', headerName: 'Type', width: 130 },
        {
            field: 'discountValue', headerName: 'Value', width: 100, renderCell: (p) => (
                <span>{p.row.discountType === 'percentage' ? `${p.value}%` : `₹${p.value}`}</span>
            )
        },
        {
            field: 'currentUses', headerName: 'Usage', width: 120, renderCell: (p) => (
                <Chip label={`${p.row.currentUses} / ${p.row.maxUses}`} size="small" variant="outlined" />
            )
        },
        { field: 'validUntil', headerName: 'Expires', width: 150, valueGetter: (p: any) => new Date(p.value).toLocaleDateString() },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 100,
            renderCell: (p) => (
                <Chip
                    label={p.value ? 'Active' : 'Inactive'}
                    color={p.value ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: (params: any) => [
                <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={() => handleOpen(params.row)} />,
                <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={() => {/* TODO: DELETE API */ }} />,
            ],
        },
    ];

    return (
        <Box sx={{ width: '100%', p: 2, bgcolor: '#fff', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Coupons Management</Typography>
                <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Create Coupon
                </Button>
            </Box>

            <div style={{ height: 600, width: '100%' }}>
                <DataGrid rows={coupons} columns={columns} getRowId={(row) => row._id} loading={loading} />
            </div>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Grid container spacing={3}>
                        <Grid item xs={12}><Typography variant="subtitle2" color="primary">Section 1: Coupon Details</Typography></Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth label="Coupon Code" required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                disabled={!!editingCoupon}
                                helperText="Uppercase, no spaces"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select fullWidth label="Discount Type" required
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                            >
                                <MenuItem value="percentage">Percentage (%)</MenuItem>
                                <MenuItem value="fixed_amount">Fixed Amount (₹)</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth type="number" label="Discount Value" required
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                            />
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>
                        <Grid item xs={12}><Typography variant="subtitle2" color="primary">Section 2: Applicability Rules</Typography></Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select fullWidth label="Applies To"
                                value={formData.appliesTo}
                                onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                            >
                                <MenuItem value="all_plans">All Paid Plans</MenuItem>
                                <MenuItem value="specific_plans">Specific Plans</MenuItem>
                                <MenuItem value="specific_tiers">Specific Tiers</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            {formData.appliesTo === 'specific_plans' && (
                                <Autocomplete
                                    multiple
                                    options={plans}
                                    getOptionLabel={(option: any) => option.name}
                                    value={plans.filter((p: any) => formData.applicablePlanIds.includes(p._id))}
                                    onChange={(_, newValue) => setFormData({ ...formData, applicablePlanIds: newValue.map((v: any) => v._id) })}
                                    renderInput={(params) => <TextField {...params} label="Select Plans" />}
                                />
                            )}
                            {formData.appliesTo === 'specific_tiers' && (
                                <Autocomplete
                                    multiple
                                    options={['basic', 'pro', 'enterprise']}
                                    value={formData.applicableTiers}
                                    onChange={(_, newValue) => setFormData({ ...formData, applicableTiers: newValue })}
                                    renderInput={(params) => <TextField {...params} label="Select Tiers" />}
                                />
                            )}
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>
                        <Grid item xs={12}><Typography variant="subtitle2" color="primary">Section 3: Usage Restrictions</Typography></Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth type="number" label="Max Total Uses" required
                                value={formData.maxUses}
                                onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth type="number" label="Uses Per User" required
                                value={formData.maxUsesPerUser}
                                onChange={(e) => setFormData({ ...formData, maxUsesPerUser: Number(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth type="number" label="Min Purchase Amt (₹)"
                                value={formData.minimumPurchaseAmount}
                                onChange={(e) => setFormData({ ...formData, minimumPurchaseAmount: Number(e.target.value) })}
                            />
                        </Grid>

                        <Grid item xs={12}><Divider /></Grid>
                        <Grid item xs={12}><Typography variant="subtitle2" color="primary">Section 4: Validity & Advanced</Typography></Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth type="date" label="Valid From" InputLabelProps={{ shrink: true }}
                                value={formData.validFrom}
                                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth type="date" label="Valid Until" required InputLabelProps={{ shrink: true }}
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={<Switch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />}
                                label="Is Active"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel
                                control={<Switch checked={formData.cannotCombineWithOtherCoupons} onChange={(e) => setFormData({ ...formData, cannotCombineWithOtherCoupons: e.target.checked })} />}
                                label="Cannot Combine Coupons"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="secondary">Save Coupon</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
