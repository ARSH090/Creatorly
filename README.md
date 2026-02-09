# Creatorly

The ultimate platform for digital creators.

## Overview
Creatorly is a headless-first digital commerce platform designed for performance, security, and scalability. It enables creators to manage products, subscriptions, and customers with ease.

## Quick Start
1. **Setup Environment**: Copy `.env.example` to `.env.local` and fill in the required keys.
2. **Install Dependencies**: `npm install`
3. **Run Development Server**: `npm run dev`
4. **Access Admin Panel**: Go to `/admin/dashboard`

## Documentation
For complete technical details, API references, and deployment guides, please refer to the **[Master Playbook](MASTER_PLAYBOOK.md)**.

## Key Features
- **Subscription Management**: Tier-based access with strict price protection.
- **Digital Storefront**: Premium product listing and sales analytics.
- **Advanced Security**: 2FA, Rate Limiting, and Fraud Detection.
- **Headless API**: v1 REST API for custom integrations.

---

## 🏗️ Architecture

- **`src/app`**: Route constraints (App Router).
- **`src/components`**: Reusable UI components.
- **`src/lib`**: Utilities, DB connection, and Models.
- **`src/hooks`**: Custom React hooks.
- **`public`**: Static assets.

## 🧪 Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |

---
© 2026 Creatorly Team
