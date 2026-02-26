---
description: Referral system for creators to earn by bringing more users.
---
# Workflow 7 — Affiliate System

1. **Recruitment**
   - User signs up via referral link (`?ref=CODE`).
   - Store cookie/session state.
2. **Conversion**
   - When referred user subscribes, link to `Affiliate` record.
3. **Payouts**
   - Track commissions based on `commissionRate`.
   - Admin approves payouts via `Payout` model.
