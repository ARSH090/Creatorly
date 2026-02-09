# 📔 Creatorly Platform: Master Playbook

Welcome to the **Creatorly Master Playbook**. This document serves as the single source of truth for the Creatorly platform, consolidating all architectural, technical, and operational information.

---

## 🏗️ 1. Architecture & Tech Stack

Creatorly is built as a highly scalable, headless-first digital commerce platform.

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| **Admin UI** | Material-UI (MUI) v5 (for premium data management) |
| **Database** | MongoDB (Mongoose) |
| **Caching** | Redis (Upstash) |
| **Authentication**| NextAuth.js |
| **Payments** | Razorpay (Webhooks driven) |
| **Email** | Resend |
| **Deployment** | Vercel |

---

## 🚀 2. Core Modules

### 2.1 Subscriptions & Plans
Managed via `/admin/subscriptions`.
- **Tiers**: Free, Basic, Pro, Enterprise.
- **Strict Logic**: Free plans are locked to ₹0 and limited features at the DB level.
- **Price Protection**: Increases >10% for active subscribers are blocked by middleware.

### 2.2 Product Management
Creators can list digital products, courses, and services.
- **Categories**: Technology, Education, Design, etc.
- **Analytics**: Per-product view/click/conversion tracking.

### 2.3 Coupons & Discounts
Advanced applicability rules supported:
- **Scope**: All plans, specific plans, or specific tiers.
- **Limits**: Max total uses and max uses per user.
- **Safety**: Coupons are automatically blocked for the Free tier.

---

## 🔐 3. Security Framework

### 3.1 Authentication & Authorization
- **RBAC**: User, Admin, Super-Admin roles.
- **2FA**: TOTP-based two-factor authentication for admins.
- **Session**: Managed via NextAuth with secure cookie hardening.

### 3.2 Security Middleware
- **Rate Limiting**: Tier-based limits (Free: 100/hr, Pro: 1000/hr).
- **Hardened Headers**: CSP, HSTS, X-Frame-Options, etc., configured in `next.config.ts`.
- **Injection Protection**: Automatic sanitization of Mongoose queries.

### 3.3 Payment Security
- **Fraud Detection**: Risk scoring for transactions (amount, history, IP).
- **3D Secure**: Enforced for high-risk or high-value transactions (>₹25,000).

---

## 📡 4. API Reference

### Public API (`/api/v1`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | GET | List public products |
| `/products/{id}` | GET | Get product details |
| `/creator/products`| POST | Create product (API Key req.) |
| `/creator/orders` | GET | List my orders (API Key req.) |

### Admin API (`/api/admin`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/plans` | POST | Manage subscription plans |
| `/admin/coupons`| POST | Manage coupons |
| `/admin/analytics`| GET | Global MRR and Churn metrics |

---

## 🛠️ 5. Deployment & Maintenance

### Environment Variables
Required in `.env.local`:
- `MONGODB_URI`: Connection string.
- `NEXTAUTH_SECRET`: Auth secret.
- `RAZORPAY_KEY_ID`: Payment gateway ID.
- `RESEND_API_KEY`: Email service key.
- `REDIS_URL`: Caching layer.

### Management Scripts
| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run setup:db` | Initialize database indexes |
| `npx tsx scripts/seed-plans.ts` | Seed default subscription tiers |
| `npm run security:scan` | Run full security audit |

---

## 🧪 6. Testing Strategy
- **Unit Tests**: `npm run test` (Vitest) - Focus on business logic.
- **E2E Tests**: `npm run test:e2e` (Playwright) - Focus on user flows.
- **Load Tests**: `npm run test:load` (k6) - Focus on payment throughput.

---
**Last Updated**: February 2026
**Status**: 🚀 Production Ready
