# 📘 CREATORLY LAUNCH DAY RUNBOOK

This document outlines the step-by-step procedures for the Creatorly launch.

## 🕒 PRE-LAUNCH (T-24 HOURS)
- [ ] **Infrastructure Final Audit**: Run `node scripts/final-security-audit.js`.
- [ ] **Database Snapshot**: Create a manual backup of the Production MongoDB.
- [ ] **Environment Verification**: Check `/api/health/deep` for green status.
- [ ] **SSL Verification**: Ensure `creatorly.in` and `app.creatorly.in` have active certs.

## 🌅 LAUNCH MORNING (T-2 HOURS)
- [ ] **Team Sync**: Brief the support and tech teams on escalation paths.
- [ ] **Monitoring Setup**: Open Vercel Logs, Datadog (or similar), and Razorpay Dashboard.
- [ ] **Cache Warmup**: Perform manual browse through the home and top 10 creator pages.

## 🚀 LAUNCH (T-0)
- [ ] **Feature Flag**: Enable public signups in `src/middleware.ts` or DB config.
- [ ] **Broadcast**: Send the waitlist announcement email via Brevo/SendGrid.
- [ ] **Socials**: Push the launch thread on Twitter and LinkedIn.

## 📡 FIRST HOUR MONITORING
- **Signals to Watch:**
  - `Meta Rate Limits`: Watch for 429 errors from Instagram API.
  - `Payment Success`: Monitor Razorpay for high failure rates.
  - `Cold Starts`: Ensure API latency stays under 1s for most requests.

## 🆘 EMERGENCY CONTINGENCY PLANS

### Scenario: Signup Surge (Site Slowdown)
1. **Immediate**: Enable "Waitlist Mode" in Admin Panel.
2. **Infra**: Scale DB instance (if using Atlas) or Vercel concurrency limits.
3. **App**: Temporarily disable non-critical AI generation features.

### Scenario: Payment Failures
1. **Verify**: Check Razorpay status page for platform incidents.
2. **Temporary**: Disable checkout and show a "Payments under maintenance" banner.
3. **Notify**: Email users with pending carts once resolved.

## 📞 ESCALATION PATHS
- **Security/Fraud**: P1 - Tech Lead (@dev)
- **Infrastructure Crash**: P1 - DevOps (@sysadmin)
- **Customer Issues**: P2 - Support Lead (@cx)

## 📊 POST-LAUNCH (T+24 HOURS)
- [ ] **Metric Review**: Analyze signup conversion rate and churn.
- [ ] **Fix Batch**: Deploy critical bug fixes identified in first 24h.
- [ ] **Retention**: Schedule the day-2 "Welcome to Creatorly" email series.
