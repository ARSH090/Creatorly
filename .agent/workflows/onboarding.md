---
description: Complete onboarding flow for new users, including username selection, personal details, Clerk Email OTP, plan selection, and Razorpay mandate setup.
---
# Workflow 1 — Onboarding & Signup

Every new user must complete all 5 steps before accessing the dashboard.

1. **Step 1: Username Selection**
   - User enters desired username.
   - Call `GET /api/auth/check-username`.
   - Block 'Next' until available.
2. **Step 2: Personal Details**
   - Collect Full Name, Email, Phone (+91), and Password (if not Google).
3. **Step 3: Email OTP Verification**
   - Trigger Clerk Email OTP verification.
   - Verified ✅ → Step 4.
4. **Step 4: Plan Selection**
   - Monthly/Yearly toggle.
   - Fetch plans via `GET /api/plans`.
5. **Step 5: Razorpay Autopay Setup**
   - Create subscription in Razorpay (14-day trial).
   - Verify mandate and create MongoDB user record.
