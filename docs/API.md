# Creatorly API Documentation

## 🔐 Authentication
Most endpoints require a Firebase ID Token passed in the Authorization header:
```http
Authorization: Bearer <firebase_id_token>
```

## 📦 Products

### List Products
`GET /api/creator/products`
Returns a list of all products for the authenticated creator.

### Create Product
`POST /api/creator/products`
Payload:
```json
{
  "name": "Digital Asset Name",
  "price": 499,
  "type": "digital",
  "description": "High-quality asset..."
}
```

### Get Single Product
`GET /api/p/[slug]`
Public endpoint to fetch product details by slug.

## 💳 Payments

### Initiate Checkout
`POST /api/payments/razorpay`
Creates a Razorpay order.

### Verify Payment
`POST /api/payments/razorpay/verify`
Payload:
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

### Razorpay Webhook
`POST /api/payments/razorpay/webhook`
Handles `payment.captured`, `payment.failed`, `subscription.charged`, etc.

## 📊 Analytics

### Track Event
`POST /api/analytics/track`
Payload:
```json
{
  "eventType": "page_view | product_view | checkout_start",
  "creatorId": "...",
  "productId": "...",
  "path": "/testcreator",
  "referrer": "..."
}
```

### Revenue Stats
`GET /api/creator/analytics/revenue`
Returns time-series revenue data.

## 🏥 Health & System

### System Health Check
`GET /api/health`
Returns the status of core services (Database, Redis, API).
Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-15T...",
  "checks": {
    "mongodb": true,
    "redis": true
  }
}
```

## 🛡️ Security
All endpoints are protected by:
- **Rate Limiting**: 30-100 requests per minute/IP.
- **XSS Protection**: Inputs are sanitized before DB persistence.
- **CSRF**: Handled natively by Next.js Auth.
