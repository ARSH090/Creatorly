# Rollback Procedures for Creatorly

Documentation for safely rolling back deployments and data changes in production.

## Quick Rollback Commands

### Vercel Deployment Rollback
```bash
# List recent deployments
vercel deployments list

# Rollback to previous deployment
vercel rollback <deployment-id>

# Or use CLI to select deployment to promote
vercel promote <deployment-id>
```

### Database Rollback (MongoDB)

#### Option 1: Restore from Backup (Recommended)
```bash
# Using MongoDB Atlas UI:
1. Go to https://cloud.mongodb.com/v2/[projectId]/clusters
2. Click on cluster name
3. Go to "Backup" tab
4. Click "Restore" on desired backup
5. Select restore type: "Automated Restore" or "Download"

# Via MongoDB CLI:
# First, list available backups
mongostat --uri="mongodb+srv://..." --discover

# Restore specific collection from backup
mongorestore --uri="mongodb+srv://..." --dir=./backup/path
```

#### Option 2: Revert Schema Changes
```javascript
// Revert User schema changes
db.users.updateMany({}, { $unset: { emailVerified: "", emailVerifiedAt: "" } })

// Revert Order schema changes
db.orders.updateMany({}, { $unset: { refundStatus: "", refundedAmount: "" } })
```

## Incident Response Playbook

### Scenario 1: Payment Processing Failed
**Symptoms:** Orders stuck in 'pending' status, Razorpay webhook not responding

**Steps:**
1. Check Razorpay dashboard for failed payments
2. Verify webhook endpoint is responding: `curl https://creatorly.app/api/payments/webhook`
3. Check logs: `vercel logs`
4. Requeue failed payments: Run `npm run requeue-payments` script
5. If critical: Rollback to last known good deployment

```bash
# Requeue failed payments
node scripts/requeue-payments.js

# Check payment status
node scripts/check-payment-status.js

# Verify webhook delivery
curl -X GET https://creatorly.app/api/health
```

### Scenario 2: Database Corruption
**Symptoms:** Random errors, missing fields, inconsistent data

**Steps:**
1. **DO NOT PANIC** - Atlas is replicated, data is safe
2. Enable read-only mode to prevent further writes
3. Restore from backup (within last 24 hours)
4. Verify data integrity: `node scripts/backup-verification.ts`
5. Resume normal operations

```bash
# Enable maintenance mode
export MAINTENANCE_MODE=true

# Verify restoration
node scripts/verify-restore.js

# Re-enable service
export MAINTENANCE_MODE=false
```

### Scenario 3: Auth/Security Issue
**Symptoms:** Unauthorized access, sessions compromised, JWT exploit

**Steps:**
1. Immediately rollback deployment
2. Rotate secrets:
   ```bash
   # Generate new JWT secret
   openssl rand -hex 32
   
   # Update .env.production with new secret
   # Redeploy immediately
   ```
3. Invalidate all active sessions:
   ```javascript
   db.sessions.deleteMany({})
   ```
4. Force users to re-login
5. Investigate root cause

### Scenario 4: Memory/CPU Spike
**Symptoms:** Slow responses, timeouts, high error rates

**Steps:**
1. Check resource usage: `vercel analytics`
2. Identify bottleneck queries: Check MongoDB slow query log
3. Optimize or rollback problematic code
4. Clear caches: `redis-cli FLUSHALL`
5. Restart containers if necessary

## Automated Rollback Triggers

```bash
# Setup automatic rollback on high error rate
# Monitor error rate continuously
# If error rate > 5% for > 5 minutes, auto-rollback

# Deployment health check
DEPLOYMENT_HEALTH_CHECK_INTERVAL=60s
ERROR_RATE_THRESHOLD=0.05
ROLLBACK_TRIGGER_TIME=300s
```

## Data Rollback Scripts

### Revert User Changes
```typescript
// scripts/rollback-user-changes.ts
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

async function rollbackUserChanges() {
  await connectToDatabase();
  
  // Revert to previous values
  const result = await User.updateMany(
    { updatedAt: { $gte: new Date(Date.now() - 3600000) } }, // Last hour
    [{ $set: { /* original values */ } }]
  );
  
  console.log(`Rolled back ${result.modifiedCount} users`);
}
```

### Revert Payment Changes
```typescript
// scripts/rollback-payments.ts
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';

async function rollbackPayments() {
  await connectToDatabase();
  
  // Revert failed payment processing
  const failedOrders = await Order.updateMany(
    { status: 'pending', createdAt: { $gte: new Date(Date.now() - 3600000) } },
    { status: 'failed' }
  );
  
  console.log(`Updated ${failedOrders.modifiedCount} orders`);
}
```

## Communication Plan

During critical incidents:

1. **Immediately:** Post status to status page (statuspage.io)
2. **Within 5 min:** Notify stakeholders (Slack #incidents)
3. **During:** Update status every 15 minutes
4. **Post-incident:** Send RCA email within 24 hours

## Testing Rollback Procedures

**Monthly rollback drill:**
```bash
1. Create test deployment
2. Simulate failure
3. Execute rollback
4. Verify all systems functioning
5. Document time taken and issues
```

## Prevention Best Practices

1. **Always test on staging first**
   ```bash
   npm run deploy:staging
   npm run test:staging
   npm run load-test:staging
   ```

2. **Use Blue-Green Deployment**
   - Keep previous version running
   - Switch traffic instantly if needed

3. **Implement Feature Flags**
   - Roll out features gradually
   - Easy disable if issues arise

4. **Monitor Everything**
   - Core Web Vitals
   - Error rates
   - Response times
   - Database performance

5. **Keep Backups Fresh**
   - Verify daily
   - Test restore monthly
   - Document restore procedures

## Contacts

- **On-Call Engineer:** Enabled via PagerDuty
- **Database Team:** #databases on Slack
- **Security Team:** security@creatorly.app
- **Infrastructure:** #infrastructure on Slack

---

Last Updated: February 2026
Next Review: March 2026
