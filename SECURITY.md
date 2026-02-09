# Creatorly Security Policy

## Security Architecture
Creatorly is built with a "Security-First" mindset, ensuring data integrity and user protection across all layers.

### 1. Authentication & Authorization
- **Firebase Authentication**: Industry-standard identity management for client-side and mobile auth.
- **Server-Side Verification**: Every API request is verified server-side using the Firebase Admin SDK.
- **Signed Admin Sessions**: Admin dashboard utilizes HMAC-SHA256 signed session tokens to prevent session spoofing and hijacking.
- **RBAC (Role-Based Access Control)**: Granular permissions system (`user`, `creator`, `admin`, `super-admin`).

### 2. Payment Security (Razorpay)
- **Signature Verification**: All payment webhooks and checkouts use cryptographic signature validation.
- **Strict Amount Check**: System verifies captured amount against original order amount to prevent "Amount Manipulation" attacks.
- **Idempotency**: Webhook handlers track processed IDs to prevent replay attacks.

### 3. Data Protection
- **HTTPS/TLS**: Mandatory for all production traffic.
- **Input Sanitization**: All user input is validated using Zod schemas.
- **Sensitive Masking**: Critical fields (passwords, PII) are masked or omitted in logs.

## Vulnerability Reporting
If you discover a security vulnerability, please email **security@creatorly.in** instead of opening a public issue. We will respond within 48 hours.

## Disclosure Policy
We follow responsible disclosure principles. Please give us reasonable time to fix bugs before publicizing them.
