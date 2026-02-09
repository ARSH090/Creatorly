# Creatorly Security Architecture

## 1. Authentication & Session Management
- **Identity Provider**: Firebase Authentication (Tiered isolation from business DB).
- **Session Strategy**: Hybrid. Client-side Firebase ID tokens synced with HTTP-only `authToken` cookies for Server-side middleware verification.
- **CSRF Protection**: Non-idempotent API requests (POST/PUT/PATCH/DELETE) require a valid `x-csrf-token` header matching the `csrfToken` cookie.
- **RBAC**: Role-Based Access Control (User, Creator, Admin, Super-Admin) enforced via `withAuth` and `withAdminAuth` server-side wrappers.

## 2. API Security
- **Rate Limiting**: Enforced via `api-security.ts`.
  - Public endpoints: 100 req/hr.
  - Auth/Payment: 5 requests/15 mins for sensitive actions.
- **Input Validation**: Zod-based schema validation on all mutating endpoints to prevent malformed data and prototype pollution.
- **XSS Prevention**: Sanitization logic in `api-security.ts` and automated Next.js output escaping.
- **CORS**: Strict origin white-listing for production domains (`creatorly.in`, `admin.creatorly.in`).

## 3. Database Security
- **Injection Prevention**: Using Mongoose (ODM) which prevents most NoSQL injection attacks. Custom regex-based sanitization for high-risk query parameters.
- **Principle of Least Privilege**: MongoDB Atlas connection strings mapped to specific application roles.
- **Data Isolation**: Multi-tenant isolation verified in all `creatorId` and `userId` scoped queries.

## 4. Payment Security (Razorpay)
- **Signature Verification**: Every Razorpay webhook payload is verified using the `x-razorpay-signature` header via HMAC-SHA256.
- **Idempotency**: All webhook events are tracked in the `ProcessedWebhook` collection to prevent double-processing of payments.
- **Amount Verification**: Webhook handler cross-checks the captured payment amount against the original order amount in the database before granting access.

## 5. Digital Asset Protection
- **Download Cloaking**: Direct S3/File URLs are never exposed to the frontend.
- **JWT Vouchers**: Short-lived (24h) JWT tokens are used as temporary vouchers for file access.
- **Persistent Tracking**: The `DownloadToken` model tracks voucher usage counts and source IPs, allowing for automatic revocation on abuse.

## 6. Infrastructure & DevOps
- **Vercel Constraints**: Use of serverless functions exclusively; no long-running tasks or local file persistence.
- **Secret Management**: All secrets (AWS, Firebase, Razorpay, Mongo) are managed via Vercel Environment Variables.
- **Audit Logs**: Admin actions (deletions, refunds, approvals) are recorded in the `AdminLog` collection with actor metadata.
