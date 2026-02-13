# 🚀 Vercel Deployment Guide - Creatorly

## Pre-Deployment Checklist

### ✅ Build Verification
- [x] Production build completed successfully
- [x] 80 static pages generated
- [x] No TypeScript errors
- [x] All automated tests passing (8/8)

### ⚠️ Environment Variables Required

**Critical - Must be set in Vercel:**

#### Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/creatorly?retryWrites=true&w=majority
```

#### Firebase Admin SDK (Server-side)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

#### Firebase Client Config (Public)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### Razorpay (Payment Gateway)
```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Security & Authentication
```
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
DELIVERY_TOKEN_SECRET=your_delivery_jwt_secret_here
ENCRYPTION_MASTER_KEY=your_encryption_key_for_sensitive_data
```

#### Email (Resend)
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### AWS S3 (Product Assets)
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=creatorly-assets
NEXT_PUBLIC_S3_DOMAIN=https://creatorly-assets.s3.ap-south-1.amazonaws.com
```

#### Application URLs
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### Optional (Redis - for rate limiting)
```
REDIS_URL=redis://...
REDIS_TOKEN=your_redis_token
```

---

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Preview**
   ```bash
   vercel
   ```
   - Follow prompts
   - Link to existing project or create new
   - Vercel will auto-detect Next.js

4. **Set Environment Variables**
   ```bash
   # Set each variable
   vercel env add MONGODB_URI production
   vercel env add FIREBASE_PROJECT_ID production
   # ... repeat for all variables
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration

3. **Configure Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from the list above
   - Select "Production" environment

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

---

## ⚙️ Vercel Configuration

Your `vercel.json` is already configured:

```json
{
  "cleanUrls": true,
  "crons": [
    {
      "path": "/api/workers/process-queue",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/publish",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/refresh-tokens?secret=YOUR_CRON_SECRET_PLACEHOLDER",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Action Required:**
- Replace `YOUR_CRON_SECRET_PLACEHOLDER` with actual secret
- Or set as environment variable: `CRON_SECRET`

---

## 🔍 Post-Deployment Verification

### 1. Check Build Logs
- Verify no errors in Vercel deployment logs
- Confirm all environment variables loaded

### 2. Test Critical Endpoints
```bash
# Homepage
curl https://your-domain.vercel.app

# Health check (if implemented)
curl https://your-domain.vercel.app/api/health

# Auth endpoints
curl https://your-domain.vercel.app/api/auth/session
```

### 3. Test User Flows
- [ ] Sign up new user
- [ ] Login existing user
- [ ] Access dashboard
- [ ] Create product (if applicable)
- [ ] Test payment flow (Razorpay)
- [ ] Verify email sending

### 4. Monitor Errors
- Check Vercel dashboard → Logs
- Monitor for runtime errors
- Check database connections

---

## 🐛 Common Issues & Solutions

### Issue: Build Fails with TypeScript Errors
**Solution:**
```bash
# Run build locally first
npm run build

# Fix any TypeScript errors
# Then deploy again
```

### Issue: Environment Variables Not Loading
**Solution:**
- Verify all variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Issue: MongoDB Connection Timeout
**Solution:**
- Whitelist Vercel IPs in MongoDB Atlas
- Or use `0.0.0.0/0` for all IPs (less secure)
- Verify connection string format

### Issue: Redis Connection Fails
**Solution:**
- App should fallback gracefully (already implemented)
- Check logs for "Redis client not available" warnings
- Optional: Set up Vercel KV or Upstash Redis

### Issue: Firebase Admin SDK Errors
**Solution:**
- Ensure `FIREBASE_PRIVATE_KEY` includes newlines: `\n`
- Wrap in double quotes in Vercel dashboard
- Verify service account has correct permissions

### Issue: Razorpay Webhooks Not Working
**Solution:**
- Update webhook URL in Razorpay dashboard
- Set to: `https://your-domain.vercel.app/api/razorpay/webhook`
- Verify `RAZORPAY_WEBHOOK_SECRET` matches

---

## 📊 Performance Optimization

### Edge Functions (Optional)
For better performance, consider using Edge Runtime for:
- `/api/auth/*` routes
- `/api/products` (read-only)

Add to route files:
```typescript
export const runtime = 'edge';
```

### Caching Strategy
- Static pages: Cached by default
- API routes: Set appropriate `Cache-Control` headers
- Images: Use Next.js Image Optimization

### Database Connection Pooling
MongoDB connection is already optimized with singleton pattern.

---

## 🔐 Security Checklist

- [ ] All secrets stored in Vercel environment variables (not in code)
- [ ] `NODE_ENV=production` set
- [ ] CORS configured properly
- [ ] Rate limiting enabled (Redis or in-memory)
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] Security headers configured

---

## 📈 Monitoring & Analytics

### Vercel Analytics
Enable in Vercel dashboard:
- Real User Monitoring (RUM)
- Web Vitals tracking
- Error tracking

### Custom Monitoring
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Datadog/New Relic for APM

---

## 🔄 CI/CD Pipeline

### Automatic Deployments
- **Production:** Deploys on push to `main` branch
- **Preview:** Deploys on push to any branch
- **Pull Requests:** Automatic preview deployments

### Deployment Protection
Enable in Vercel:
- Require approval for production deployments
- Enable deployment protection rules
- Set up custom domains

---

## 🌐 Custom Domain Setup

1. **Add Domain in Vercel**
   - Dashboard → Settings → Domains
   - Add your custom domain

2. **Configure DNS**
   - Add CNAME record: `your-domain.com` → `cname.vercel-dns.com`
   - Or A record to Vercel IP

3. **SSL Certificate**
   - Automatic via Let's Encrypt
   - Usually takes 1-2 minutes

---

## 📝 Environment-Specific Configuration

### Development
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging/Preview
```bash
# Vercel Preview environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-git-branch.vercel.app
```

### Production
```bash
# Vercel Production environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🚨 Rollback Plan

If deployment fails:

1. **Instant Rollback**
   ```bash
   vercel rollback
   ```

2. **Via Dashboard**
   - Deployments → Previous deployment → Promote to Production

3. **Via Git**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Support:** https://vercel.com/support

---

## ✅ Final Checklist Before Going Live

- [ ] All environment variables configured
- [ ] Production build successful
- [ ] Database accessible from Vercel
- [ ] Payment gateway tested (Razorpay)
- [ ] Email sending verified
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Error monitoring enabled
- [ ] Backup strategy in place
- [ ] Team notified of deployment
- [ ] Documentation updated

---

## 🎉 You're Ready to Deploy!

Run:
```bash
vercel --prod
```

Or push to `main` branch if using GitHub integration.

**Good luck! 🚀**
