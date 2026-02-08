# Creatorly Deployment & Launch Guide

**⚠️ Read this before going live!**

---

## 🚀 Pre-Launch Checklist

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in all values:

```bash
# Critical
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=your-32-char-secret
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=rzp_live_secret

# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@creatorly.app

# Caching (Upstash Redis)
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=****

# Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXX
```

### 2. Verify All Systems
```bash
# Run all tests and verification
npm run lint                    # Check code quality
npm run build                   # Full production build
npm run test                    # Unit tests
npm run verify:backup          # Database backup verification
npx playwright test             # E2E tests (requires dev server)
```

### 3. Database Backup
```bash
# Verify MongoDB Atlas backups are enabled
# Go to https://cloud.mongodb.com/v2/[projectId]/clusters
# Check "Backup" tab - ensure backups are running
npm run verify:backup          # Run verification script
```

### 4. Service Configurations
- [ ] Vercel deployment configured
- [ ] Upstash Redis provisioned
- [ ] Resend email API key active
- [ ] Razorpay account in LIVE mode
- [ ] Google Analytics 4 property created
- [ ] Slack webhook configured (for alerts)
- [ ] GitHub repository linked to Vercel

---

## 📦 Deployment to Production

### Step 1: Build & Test
```bash
# Install latest dependencies
npm install

# Build production bundle
npm run build

# Run full test suite
npm run test
npm run test:e2e
```

### Step 2: Deploy to Vercel
```bash
# Via Vercel CLI
vercel deploy --prod

# Or push to main branch (auto-deploy if configured)
git push origin main
```

### Step 3: Verify Deployment
```bash
# Check health endpoint
curl https://creatorly.app/api/health

# Test email service
# Try password reset on login page

# Verify analytics
# Check Google Analytics dashboard

# Monitor error rates
# Check Sentry/error tracking dashboard
```

### Step 4: Enable Monitoring
```bash
# Start monitoring alerts system
# Ensure Slack notifications enabled
# Monitor logs: vercel logs

# Watch error rate dashboard
# Set up PagerDuty if using
```

---

## 🧪 Testing in Production

### Smoke Tests (After Deployment)
```bash
# 1. User registration
POST /api/auth/register
{
  "email": "test@example.com",
  "username": "testuser",
  "displayName": "Test User",
  "password": "TestPassword123"
}

# 2. Check email was sent (Resend dashboard)

# 3. Test payment flow
# Create order at /checkout
# Use Razorpay test card: 4111 1111 1111 1111

# 4. Check refund endpoint
GET /api/payments/refund

# 5. Verify analytics data
# Check GA4 real-time dashboard
```

### Load Testing
```bash
# Run load tests (NOT during peak hours)
npm run test:load

# Monitor response times
# Check error rates < 1%
# Verify database doesn't spike in latency
```

---

## 🔑 Critical Features & How to Use

### Email Service
**Sending verification emails:**
```typescript
import { sendVerificationEmail } from '@/lib/services/email';

// In register endpoint
const token = crypto.randomBytes(32).toString('hex');
await sendVerificationEmail(email, token);
```

**User verifies email:**
- They click link: `https://creatorly.app/auth/verify-email?token=xxx`
- Or call: `POST /api/auth/verify-email` with token

### Password Reset
**User requests reset:**
```bash
POST /api/auth/forgot-password
{ "email": "user@example.com" }
```

**User receives email and clicks link**
- Link: `https://creatorly.app/auth/reset-password?token=xxx`

**User sets new password:**
```bash
POST /api/auth/reset-password
{
  "token": "xxx",
  "password": "NewSecurePassword123",
  "confirmPassword": "NewSecurePassword123"
}
```

### Refund Processing
**Customer requests refund:**
```bash
POST /api/payments/refund
{
  "orderId": "xxx",
  "reason": "customer_request",
  "notes": "Optional notes"
}
```

**Razorpay processes immediately**, status → initiated → success/failed

### Coupons
**Admin creates coupon:**
```bash
POST /api/coupons (admin only)
{
  "code": "SAVE10",
  "discountType": "percentage",
  "discountValue": 10,
  "validFrom": "2026-02-08",
  "validUntil": "2026-03-08"
}
```

**Customer applies coupon:**
```bash
POST /api/coupons/validate
{
  "code": "SAVE10",
  "cartTotal": 10000
}
```

### Dark Mode
**In your root layout:**
```tsx
import { ThemeProvider } from '@/lib/themes/ThemeProvider';

export default function RootLayout() {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Users can toggle theme:**
```tsx
import { ThemeToggle } from '@/lib/themes/ThemeProvider';

// Add to header
<ThemeToggle />
```

### Analytics
**In your app layout:**
```tsx
import GA4Analytics from '@/lib/analytics/ga4';

<GA4Analytics measurementId="G-XXXXX" />
```

**Track custom events:**
```tsx
import { trackPurchase } from '@/lib/analytics/ga4';

trackPurchase(orderId, amount, 'INR', [{
  item_id: productId,
  item_name: 'Product Name',
  price: 100
}]);
```

### A/B Testing
**Create experiment:**
```typescript
import { getABTestingFramework } from '@/lib/testing/ab-testing';

const framework = getABTestingFramework();
framework.createExperiment({
  name: 'Payment Button Color',
  variants: [
    { name: 'blue', weight: 50 },
    { name: 'green', weight: 50 }
  ],
  startDate: new Date(),
});
```

**Use in component:**
```tsx
import { useABTest } from '@/lib/testing/ab-testing';

export function CheckoutButton() {
  const { variant, trackEvent } = useABTest('exp_xxx', userId);
  
  const buttonColor = variant === 'blue' ? '#0066cc' : '#00aa00';
  
  const handleClick = () => {
    trackEvent('button_clicked');
  };
  
  return <button style={{ backgroundColor: buttonColor }} onClick={handleClick} />;
}
```

### Redis Caching
**Cache database query:**
```typescript
import { getOrSet } from '@/lib/cache/redis';

// In API route
const user = await getOrSet(
  `user:${userId}`,
  async () => User.findById(userId),
  { ttl: 3600, tags: ['users'] } // 1 hour, cacheable by 'users' tag
);
```

**Invalidate by tag:**
```typescript
import { invalidateByTag } from '@/lib/cache/redis';

// When user is updated
await invalidateByTag('users');
```

### Alerts & Monitoring
**Initialize on app startup:**
```typescript
import { initializeAlerts } from '@/lib/monitoring/alerts';

initializeAlerts({
  errorRateThreshold: 0.05,
  responseTimeThreshold: 1000,
  paymentFailureThreshold: 0.02,
  databaseLatencyThreshold: 500,
  checkInterval: 60,
  emailAlerts: ['devops@creatorly.app'],
  slackWebhook: process.env.SLACK_WEBHOOK,
});
```

**Update metrics:**
```typescript
import { getAlertsSystem } from '@/lib/monitoring/alerts';

const alerts = getAlertsSystem();
alerts.updateMetric('errorRate', 0.03);
```

---

## 🆘 Incident Response

### Payment Processing Failing
1. Check Razorpay dashboard for outages
2. Verify webhook endpoint: `curl https://creatorly.app/api/payments/webhook`
3. Check server logs: `vercel logs`
4. Requeue failed payments: See `ROLLBACK_PROCEDURES.md`

### High Error Rates
1. Check error tracking (Sentry/logs)
2. Review recent deployments
3. Execute rollback if needed
4. Communicate via status page

### Database Issues
1. Run backup verification: `npm run verify:backup`
2. Check MongoDB Atlas metrics
3. Consider restore from backup
4. See `ROLLBACK_PROCEDURES.md` for detailed steps

### Spike in Response Times
1. Check Redis connection status
2. Monitor database query performance
3. Clear cache if needed
4. Review recent code changes

---

## 📊 Monitoring Dashboards

Set up these dashboards:

1. **Error Rate** - Alert if > 1%
2. **Response Time** - Alert if > 1 second
3. **Payment Success Rate** - Alert if < 99%
4. **Database Latency** - Alert if > 500ms
5. **Cache Hit Rate** - Monitor for optimization
6. **Active Users** - From GA4
7. **Conversion Funnel** - From GA4

---

## 🔐 Security Checklist

- [ ] NEXTAUTH_SECRET is strong (32+ chars)
- [ ] All secrets are in production environment (not in code)
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured properly
- [ ] Rate limiting active on auth endpoints
- [ ] Password reset links expire in 1 hour
- [ ] Backup verification runs daily
- [ ] Session timeouts configured (30 days)
- [ ] CSRF protection enabled
- [ ] Security headers in place (CSP, HSTS)

---

## 📞 Contacts & Escalation

- **DevOps Issues**: #infrastructure on Slack
- **Database Issues**: #databases on Slack
- **Payment Issues**: Razorpay support
- **Email Issues**: Resend support
- **Caching Issues**: Upstash support
- **Analytics Issues**: Google Analytics support

---

## 🎉 Launch Announcement

Once everything is verified:

1. Update status page: "Live"
2. Send email to early access users
3. Post on social media
4. Monitor first hour closely
5. Be ready for support requests
6. Celebrate! 🎊

---

**Last Updated**: February 2026  
**Next Review**: After first week of launch
