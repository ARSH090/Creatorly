# Creatorly Deployment Guide

This guide details the step-by-step process for deploying **Creatorly** to a production environment using Vercel, MongoDB Atlas, AWS, Razorpay, and Clerk.

## 1. Environment Variables (Vercel)
Ensure the following variables are configured in your Vercel project settings:

### 🌐 Core Web & Auth (Clerk)
- `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://creatorly.app`).
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: From Clerk Dashboard.
- `CLERK_SECRET_KEY`: From Clerk Dashboard.
- `CLERK_WEBHOOK_SECRET`: Required for MongoDB synchronization.

### 🍃 Database & Cache
- `MONGODB_URI`: Connection string to your production cluster.
- `REDIS_URL`: Upstash Redis connection string (required for BullMQ).

### 💳 Payments (Razorpay)
- `RAZORPAY_KEY_ID`: Your **Live** Key ID.
- `RAZORPAY_KEY_SECRET`: Your **Live** Key Secret.
- `RAZORPAY_WEBHOOK_SECRET`: The secret string defined in your Razorpay Webhook settings.

### 📦 Storage (AWS S3)
- `AWS_ACCESS_KEY_ID`: IAM user access key.
- `AWS_SECRET_ACCESS_KEY`: IAM user secret key.
- `AWS_REGION`: e.g., `ap-south-1` (Mumbai).
- `AWS_S3_BUCKET_NAME`: Name of your production S3 bucket.

## 2. Infrastructure Setup

### MongoDB Atlas
1. Create a production cluster (M10+ recommended).
2. Configure Network Access: Whitelist Vercel IP ranges or allow access from `0.0.0.0/0`.
3. Enable automated daily backups.

### Upstash Redis (For Queues)
1. Create a Global Redis database on Upstash.
2. Copy the `REDIS_URL` to your environment variables.
3. **Important**: Ensure `maxRetriesPerRequest` is set to `null` in the connection (handled in `src/lib/queue.ts`).

### Background Worker Deployment
The background worker (`worker.ts`) requires a persistent Node.js environment (Vercel is serverless and cannot run persistent BullMQ workers).
1. **Platform**: Deploy to Railway, Render, or DigitalOcean App Platform.
2. **Build Command**: `npm install`
3. **Start Command**: `npm run worker`
4. **Environment**: Ensure all variables from Section 1 (especially `REDIS_URL` and `MONGODB_URI`) are present on the worker instance.

## 3. Verification
After deployment, run the following verification steps:
1. Hit `GET /api/health` to confirm DB connectivity.
2. Access `/admin/queues` to verify BullMQ connectivity.
3. Check Sentry dashboard for any initialization errors.
