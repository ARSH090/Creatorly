# Creatorly Production Deployment Guide

## Platform Requirements
- **Hosting**: Vercel (Recommended for Next.js App Router)
- **Database**: MongoDB Atlas
- **Auth**: Firebase Project
- **Payments**: Razorpay Account

## Step-by-Step Deployment

### 1. Database Setup
1. Create a MongoDB Atlas cluster.
2. Whitelist Vercel IP ranges or allow all IPs (0.0.0.0/0).
3. Copy the Connection String.

### 2. Firebase Configuration
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Go to **Project Settings > Service Accounts** and generate a new Private Key.
3. Enable **Authentication** (Email + Google).

### 3. Razorpay Integration
1. login to Razorpay Dashboard.
2. Generate API Keys (Key ID & Secret).
3. Setup a Webhook pointing to `https://your-domain.com/api/payments/webhook`.
4. Select events: `payment.captured`, `subscription.activated`.

### 4. Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Import all variables from `.env.example` into Vercel **Environment Variables**.
3. Deploy!

## Post-Deployment Checklist
- [ ] Verify 2FA works for the first admin login.
- [ ] Perform a test transaction in Razorpay Test Mode.
- [ ] Check `sitemap.xml` and `robots.txt` are accessible.
- [ ] Verify API rate limits are active in production logs.
