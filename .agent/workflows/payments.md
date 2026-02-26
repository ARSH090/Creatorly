---
description: Handles subscription lifecycle from trial to charge, cancellation, and failed payments.
---
# Workflow 2 — Payment & Subscription

1. **Subscription Creation**
   - Razorpay mandate authorized at ₹0 for 14-day trial.
   - Webhook `subscription.activated` updates MongoDB.
2. **Trial Lifecycle**
   - Day 11/13 reminders.
   - Day 14: Charge fires.
3. **Charge Success**
   - Update `subscriptionStatus: 'active'`.
   - Unlock full features.
4. **Charge Failure**
   - Update `subscriptionStatus: 'past_due'`.
   - 2-day grace period, then `halted`.
5. **Cancellation**
   - Keep access until `currentPeriodEnd`.
   - Revoke to Free tier after period ends.
