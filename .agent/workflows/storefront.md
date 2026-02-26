---
description: Creator storefront with SSR, custom themes, and direct product delivery via S3 signed URLs.
---
# Workflow 4 — Storefront & Product Delivery

1. **Rendering**
   - Direct SSR via `[username]/page.tsx`.
   - Parallel fetching of Creator Profile, Products, and Links.
2. **Product Purchase**
   - Click 'Buy Now' → Modal → Razorpay Order.
   - Success → Webhook `payment.captured`.
3. **Delivery**
   - User redirected to Success page.
   - Generate AWS S3 Signed URL for product file.
   - Email delivery via SendGrid/Resend.
4. **Access Control**
   - Verify `orderStatus: 'completed'` before providing download link.
