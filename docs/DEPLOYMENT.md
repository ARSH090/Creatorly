# Creatorly Deployment Guide

This guide details the step-by-step process for deploying **Creatorly** to a production environment using Vercel, MongoDB Atlas, AWS, Razorpay, and Firebase.

## 1. Environment Variables (Vercel)
Ensure the following variables are configured in your Vercel project settings:

### 🌐 Core Web
- `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://creatorly.app`).
- `NODE_ENV`: `production`.

### 🍃 Database (MongoDB Atlas)
- `MONGODB_URI`: Connection string to your production cluster.
- `MONGODB_DB`: Database name (e.g., `creatorly_prod`).

### 🔑 Authentication (Firebase)
- `FIREBASE_PROJECT_ID`: Your Firebase Project ID.
- `FIREBASE_CLIENT_EMAIL`: Service Account Email.
- `FIREBASE_PRIVATE_KEY`: Service Account Private Key (ensure standard PEM format).

### 💳 Payments (Razorpay)
- `RAZORPAY_KEY_ID`: Your **Live** Key ID.
- `RAZORPAY_KEY_SECRET`: Your **Live** Key Secret.
- `RAZORPAY_WEBHOOK_SECRET`: The secret string defined in your Razorpay Webhook settings.

### 📦 Storage (AWS S3)
- `AWS_ACCESS_KEY_ID`: IAM user access key.
- `AWS_SECRET_ACCESS_KEY`: IAM user secret key.
- `AWS_REGION`: e.g., `ap-south-1` (Mumbai).
- `AWS_S3_BUCKET_NAME`: Name of your production S3 bucket.

### 🪵 Logging & Monitoring
- `SENTRY_DSN`: Your Sentry project DSN.
- `LOG_LEVEL`: Set to `info` for production.

## 2. Infrastructure Setup

### MongoDB Atlas
1. Create a production cluster (M10+ recommended for dedicated throughput).
2. Configure Network Access: Whitelist Vercel IP ranges or allow access from `0.0.0.0/0` (with strong DB password).
3. Ensure automated daily backups are enabled.

### AWS S3 Settings
1. Create a bucket with **Block all public access** enabled.
2. Configure CORS to allow your production domain:
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"]
  }
]
```

### Razorpay Webhooks
1. In the Razorpay Dashboard, add the webhook URL: `https://yourdomain.com/api/payments/razorpay/webhook`.
2. Select these events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.charged`
   - `refund.created`

## 3. Verification
After deployment, run the following verification steps:
1. Hit `GET /api/health` to confirm DB connectivity.
2. Perform a test purchase using a real live card (refund it immediately after).
3. Check Sentry dashboard for any initialization errors.
