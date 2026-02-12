# Admin Panel Setup Guide

## 🎯 Quick Start

The Creatorly admin panel allows platform administrators to manage users, products, orders, coupons, and payouts. Follow these steps to set up admin access.

---

## 1. Create Admin User in Firebase

**Step 1**: Create a regular user account in Firebase (if not already created)
- Sign up at `/register` with your admin email

**Step 2**: Grant admin privileges using the script
```bash
cd e:\insta
npm run admin:set-custom-claim admin@creatorly.in
```

Or run directly:
```bash
ts-node scripts/set-admin.ts admin@creatorly.in
```

**Step 3**: Sign out and sign back in for changes to take effect

---

## 2. Environment Variables

Add to `.env.local`:
```env
ADMIN_EMAIL=admin@creatorly.in
ADMIN_PASSWORD=YourStrongPassword123!
```

> **Note**: These are for reference only. Actual authentication uses Firebase custom claims.

---

## 3. Access Admin Panel

**Login**: Navigate to `/admin/login` (coming soon - API is ready)

**Authentication**: Uses Firebase Auth with `admin: true` custom claim

---

## 📡 Available Admin API Endpoints

All endpoints require `Authorization: Bearer <firebase-token>` header with admin claim.

### Analytics
- `GET /api/admin/analytics/summary` - Platform metrics (users, revenue, orders)

### Users
- `GET /api/admin/users` - List all users with stats
- `PUT /api/admin/users/:id` - Update user (plan, status, role)
- `DELETE /api/admin/users/:id` - Delete user (soft delete)

### Products
- `GET /api/admin/products` - List all products
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

### Orders
- `GET /api/admin/orders` - List all orders
- `POST /api/admin/orders/:id/refund` - Issue refund (Razorpay integrated)

### Coupons (Complete CRUD)
- `GET /api/admin/coupons` - List coupons
- `POST /api/admin/coupons` - Create coupon
- `GET /api/admin/coupons/:id` - Get coupon details
- `PUT /api/admin/coupons/:id` - Update coupon
- `DELETE /api/admin/coupons/:id` - Delete coupon

### Payouts
- `GET /api/admin/payouts` - List all payouts
- `POST /api/admin/payouts/:id?action=approve` - Approve payout
- `POST /api/admin/payouts/:id?action=reject` - Reject payout
- `POST /api/admin/payouts/:id?action=process` - Mark as paid

### Audit Logs
- `GET /api/admin/logs` - View all admin actions

---

## 🎟️ Coupon System

### Creating a Coupon

**Example Request**:
```json
POST /api/admin/coupons
{
  "code": "LAUNCH20",
  "description": "Launch promo - 20% off",
  "discountType": "percentage",
  "discountValue": 20,
  "minOrderAmount": 500,
  "maxDiscountAmount": 1000,
  "usageLimit": 100,
  "usagePerUser": 1,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z",
  "status": "active"
}
```

### Coupon Fields

| Field | Required | Description |
|-------|----------|-------------|
| `code` | Yes | Unique code (uppercase) |
| `discountType` | Yes | `percentage` or `fixed` |
| `discountValue` | Yes | Percentage (0-100) or rupee amount |
| `minOrderAmount` | No | Minimum cart value |
| `maxDiscountAmount` | No | Max discount (for percentage type) |
| `usageLimit` | No | Total usage limit (null = unlimited) |
| `usagePerUser` | No | Per-customer limit (default: 1) |
| `validFrom` | No | Start date (default: now) |
| `validUntil` | No | End date (null = no expiry) |
| `applicableProducts` | No | Array of product IDs (empty = all) |
| `applicableCreators` | No | Array of creator IDs (empty = all) |
| `status` | No | `active`, `inactive`, or `expired` |

---

## 💵 Payout Management

### Approve Payout
```bash
POST /api/admin/payouts/:id?action=approve
{
  "notes": "Approved for processing"
}
```

### Reject Payout
```bash
POST /api/admin/payouts/:id?action=reject
{
  "reason": "Insufficient revenue period"
}
```

### Mark as Paid
```bash
POST /api/admin/payouts/:id?action=process
{
  "transactionId": "TXN123456"
}
```

---

## 💰 Refund Processing

Refunds are processed through Razorpay API:

```bash
POST /api/admin/orders/:id/refund
{
  "amount": 500,  # Optional, defaults to full order amount
  "reason": "Customer request"
}
```

**What happens**:
1. Processes refund via Razorpay API
2. Updates order status to `refunded`
3. Logs admin action

---

## 🔐 Security Features

1. **Firebase Custom Claims**: Only users with `admin: true` can access
2. **Token Verification**: Every request validates Firebase token
3. **Audit Logging**: All admin actions logged to database
4. **IP Tracking**: Admin actions include IP and user agent

---

## 📝 Audit Logs

All admin actions are automatically logged:

```typescript
{
  adminEmail: "admin@creatorly.in",
  action: "UPDATE_USER",
  targetType: "user",
  targetId: "user_id_here",
  changes: {
    plan: { from: "free", to: "creator_pro" }
  },
  ipAddress: "x.x.x.x",
  timestamp: "2024-..."
}
```

**View logs**:
```bash
GET /api/admin/logs?page=1&limit=50
GET /api/admin/logs?action=UPDATE_USER
GET /api/admin/logs?targetType=coupon
```

---

## 🚀 Next Steps

1. **Create Admin User**: Run `npm run admin:set-custom-claim your@email.com`
2. **Test API**: Use Postman/Thunder Client with Firebase token
3. **Build UI** (Optional): Admin dashboard pages in `/app/admin/*`

---

## 🛠️ Troubleshooting

### "Forbidden - Admin access required"
- Ensure you ran `set-admin.ts` script
- Sign out and sign back in
- Check Firebase Auth custom claims in console

### "Module './admin' has no exported member 'initAdmin'"
- Ensure `src/lib/firebase/admin.ts` exports `initAdmin` function
- Check Firebase Admin SDK is properly initialized

### Coupon not applying at checkout
- Verify coupon status is `active`
- Check validity dates
- Ensure product/creator applicability
- Check usage limits

---

## 📊 Database Models

### Coupon Schema
Fields: code, discountType, discountValue, minOrderAmount, maxDiscountAmount, applicableProducts, applicableCreators, usageLimit, usagePerUser, usedCount, validFrom, validUntil, status

### AdminLog Schema
Fields: adminEmail, action, targetType, targetId, changes, ipAddress, userAgent, timestamp

---

##Future Enhancements

- [ ] Admin UI dashboard pages
- [ ] Bulk actions (suspend multiple users)
- [ ] Export logs as CSV
- [ ] Email notifications for admin actions
- [ ] Two-factor authentication for admin
- [ ] Role-based permissions (super admin vs admin)

---

**Admin Panel v1.0** - Complete API implementation ready for production 🚀
