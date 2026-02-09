# Creatorly Technical Documentation

## 1. PROJECT OVERVIEW

**Creatorly** is a comprehensive "Operating System for Indian Creators." It solves the fragmentation problem in the creator economy by providing a single, unified platform where creators can:
- **Sell Digital Products:** E-books, presets, templates.
- **Host Courses:** Structured learning with video modules and progress tracking.
- **Manage Memberships:** Recurring revenue streams with exclusive community access.
- **Build a Brand:** Custom "Link-in-Bio" style storefrons with high-fidelity design.

**Target Audience:** Indian content creators, educators, and digital artists looking for a professional, all-in-one monetization solution.

**Core Objectives:**
1.  **Monetization:** Streamlined payments via Razorpay for one-time and recurring billing.
2.  **Performance:** Sub-second load times for storefronts to maximize conversion.
3.  **Simplicity:** No-code, drag-and-drop store building experience.
4.  **Trust:** Secure file delivery and robust authentication.

**System Philosophy:** "Creator-First Engineering." Every technical decision prioritizes the creator's user experience (UX) and the speed/reliability of their storefronts.

---

## 2. TECHNOLOGY STACK

### Frontend
-   **Next.js 16 (App Router):** Chosen for its server-side rendering (SSR) capabilities, which are crucial for SEO and initial load performance of creator storefronts. The App Router allows for efficient layouts and nested routing.
-   **React 19:** The core UI library, leveraging Server Components for reduced client-side bundle size.
-   **Tailwind CSS v4:** Utility-first CSS framework for rapid UI development and consistent design tokens (colors, spacing).
-   **Framer Motion:** Used for high-fidelity animations (page transitions, micro-interactions) to give the platform a premium feel.
-   **Lucide React:** Consistent, lightweight icon set.
-   **Recharts:** For visualizing analytics data (sales, views) in the dashboard.

### Backend
-   **Next.js API Routes:** Serverless functions that handle API requests. Chosen for seamless integration with the frontend and easy scaling on Vercel.
-   **Node.js:** The runtime environment.
-   **Mongoose:** ODM (Object Data Modeling) library for MongoDB, providing schema validation and easy database interaction.
-   **NextAuth.js (v4):** Handles authentication (Google, Email/Password) and session management.

### Database & Storage
-   **MongoDB (Atlas):** NoSQL database chosen for its flexibility with varying product structures (digital vs. course vs. membership) and scalability.
-   **Redis (Upstash/Self-hosted):** Used for rate limiting (via `ioredis`) to protect APIs from abuse.
-   **Cloudinary:** Image and video hosting optimization.
-   **Digital File Storage:** Secure storage for digital assets (PDFs, Zip files) with signed URL delivery.

### Hosting & Infrastructure
-   **Vercel:** Primary hosting provider for Next.js, handling global CDN, serverless functions, and deployments.
-   **GitHub:** Source control and CI/CD trigger.

### External APIs
-   **Razorpay:** Payment gateway for Indian payment methods (UPI, Cards, Netbanking) and subscriptions.
-   **Resend/Nodemailer:** Transactional email delivery (welcome emails, purchase receipts).

---

## 3. PROJECT DIRECTORY STRUCTURE

```
e:\insta
├── public/                 # Static assets (images, logos, robots.txt)
├── src/
│   ├── app/                # Next.js App Router (Routes & Pages)
│   │   ├── (dashboard)/    # Authenticated dashboard routes (Profile, Billing, Projects)
│   │   ├── (legal)/        # Public legal pages (Privacy, Terms)
│   │   ├── admin/          # Admin-only routes
│   │   ├── api/            # Backend API routes
│   │   ├── auth/           # Auth-related pages (Login, Register)
│   │   ├── u/[username]/   # Dynamic creator storefronts
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── components/         # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── auth/           # Auth forms and guards
│   │   ├── dashboard/      # Dashboard widgets and layouts
│   │   ├── layout/         # Header, Footer, Sidebar
│   │   └── storefront/     # Public storefront components
│   ├── lib/                # Shared utilities and logic
│   │   ├── db/             # Database connection (mongodb.ts)
│   │   ├── models/         # Mongoose schemas (User, Product, Order)
│   │   ├── security/       # Security utils (rate-limit, headers)
│   │   └── services/       # Business logic services
│   ├── middleware.ts       # Global request middleware (Auth, Rate Limit)
│   └── types/              # TypeScript definitions
├── next.config.ts          # Next.js configuration (Headers, Images)
├── package.json            # Dependencies and scripts
└── tailwind.config.ts      # Design system configuration
```

**File Interaction:**
-   `src/app/api` routes import models from `src/lib/models`.
-   `src/app/(dashboard)` pages use components from `src/components/dashboard`.
-   `middleware.ts` intercepts requests before they reach `src/app`.
-   `src/lib/db/mongodb.ts` is imported by API routes to ensure DB connection.

---

## 4. SYSTEM ARCHITECTURE

The system follows a **Monolithic Serverless Architecture**.

**Diagram Description:**
`[Browser]` <-> `[Vercel Edge Network]` <-> `[Next.js Application]` <-> `[MongoDB Atlas]`
                                                        ^
                                                        |
                                                  `[Razorpay API]` / `[Redis]`

1.  **Client (Browser):**
    *   **Storefronts:** Public visitors access `creatorly.in/u/username`. These pages are SSR-optimized for SEO.
    *   **Dashboard:** Creators access `creatorly.in/dashboard`. These pages are Client-Side Rendered (CSR) or hybrid for interactivity.

2.  **Edge Layer (Middleware):**
    *   Every request hits `src/middleware.ts`.
    *   **Rate Limiting:** IP-based check using Redis.
    *   **Security Headers:** Injects HSTS, CSP, X-Frame-Options.
    *   **Authentication:** Verifies JWT session tokens for protected routes.

3.  **Application Layer (Next.js):**
    *   **Server Components:** Fetch data directly from DB (e.g., product details).
    *   **API Routes (`/api/*`):** Handle mutations (Creating products, updating profile) and complex logic (Checkout flow).

4.  **Data Layer:**
    *   **MongoDB:** Stores strict schemas for Users, Products, Orders, etc.
    *   **Pre-save Hooks:** Models like `Plan.ts` and `Coupon.ts` have logic to enforce data integrity before saving.

---

## 5. FRONTEND DEEP DIVE

### Page-by-Page Breakdown
1.  **Landing Page (`/`):** Public marketing page. High-performance, static content.
2.  **Dashboard (`/dashboard`):**
    *   **Overview:** Charts, recent sales.
    *   **Products:** List, Create, Edit. Includes multi-step wizard for product creation.
    *   **Analytics:** Detailed charts using `Recharts`.
    *   **Settings:** Profile, Payouts, Billing.
3.  **Storefront (`/u/[username]`):**
    *   Dynamic route. Fetches `CreatorProfile` based on `username`.
    *   Renders specific `StoreTheme` (e.g., "Minimal", "Grid").
    *   Lists `Product` cards.
4.  **Auth Pages (`/auth/login`, `/auth/register`):**
    *   Custom forms using `react-hook-form` and `zod` validation.
    *   Interacts with `NextAuth` via `signIn()`.

### Components & State
-   **UI Library:** Custom components built with Tailwind CSS. No heavy UI framework dependency (like Bootstrap).
-   **State Handling:**
    *   **Server State:** Fetched via Server Components (RSC) where possible.
    *   **Client State:** `useState` for local UI interactions (modals, dropdowns).
    *   **Forms:** `react-hook-form` manages form state and validation locally.
    *   **Auth State:** `useSession` hook from `next-auth/react` provides user context globally.

### User Interaction Flow
1.  User clicks "Save Product".
2.  `onSubmit` handler prevents default.
3.  `zod` validates input.
4.  If valid, `fetch('/api/products', ...)` is called.
5.  On success, `router.push('/dashboard/products')` redirects user.
6.  `toast` notification shows "Product Saved".

---

## 6. BACKEND DEEP DIVE

### Server Setup
-   Next.js API routes are effectively serverless functions.
-   There is no persistent "server" process.
-   `src/lib/db/mongodb.ts` maintains a *cached* connection pool to reuse connections across hot reloads and function invocations.

### Route Definitions
-   **`/api/auth/[...nextauth]`**: Handles all auth logic (GET for session, POST for signin/signout).
-   **`/api/user`**: User profile management.
-   **`/api/products`**: CRUD operations for products.
-   **`/api/payments/*`**: Order creation, verification, and webhooks.

### Controllers & Services
-   Route handlers specific `GET`, `POST`, `PUT`, `DELETE` functions.
-   **Service Layer Pattern:** Complex logic is often abstracted into `src/lib/services` (e.g., `PaymentService`, `EmailService`) to keep route handlers clean.

### Request Lifecycle
1.  **Request:** Incoming HTTP request to `/api/products`.
2.  **Middleware:** `middleware.ts` checks rate limit and auth headers.
3.  **Handler:** `POST` function in `route.ts` is invoked.
4.  **Validation:** `zod` schema parses request body.
5.  **DB Operation:** Mongoose model `Product.create(...)` runs.
6.  **Response:** `NextResponse.json(...)` returns 201 Created.

---

## 7. DATABASE DESIGN

### Schema & Tables
-   **Users:** Stores auth info, profile data, and settings.
    *   `email`: String (Unique)
    *   `password`: String (Hashed)
    *   `role`: Enum ('user', 'creator', 'admin')
-   **Products:** Polymorphic content.
    *   `type`: Enum ('digital', 'course', 'membership')
    *   `price`: Number
    *   `files`: Array (Cloudinary URLs)
    *   `creatorId`: ObjectId (Ref: User)
-   **Orders:** Transaction history.
    *   `status`: Enum ('pending', 'completed', 'failed')
    *   `razorpayOrderId`: String
    *   `amount`: Number
-   **Plans:** Subscription tiers logic.
-   **Coupons:** Discount rules.
-   **CourseContent:**
    *   `modules`: Array of lessons
    *   `productId`: ObjectId (Ref: Product)

### Relationships
-   **User -> Products:** One-to-Many.
-   **User -> Orders:** One-to-Many (as buyer).
-   **Product -> Orders:** One-to-Many.

### Indexing
-   `{ email: 1 }` on Users (Unique).
-   `{ username: 1 }` on Users (Unique, for profile URLs).
-   `{ creatorId: 1 }` on Products (For fetching a creator's catalog).
-   `{ slug: 1 }` on Products (For SEO URLs).

---

## 8. AUTHENTICATION & SECURITY

### Auth Flow (NextAuth.js)
1.  **Login:** Frontend calls `signIn('credentials', { email, password })`.
2.  **Verification:** Backend verifies hash against DB.
3.  **Token Issue:** JWT created with user ID and Role.
4.  **Storage:** JWT stored in `__Secure-next-auth.session-token` cookie.
5.  **Access:** Browser calculates Authorization header or sends cookie automatically.

### Enterprise Security & Abuse Prevention
-   **Device Fingerprinting:**
    -   Uses `FingerprintJS` to generate a unique hash for each device.
    -   Stores in `Device` collection with metadata (IP, User Agent, Trust Score).
-   **Registration Guard:**
    -   `POST /api/auth/register` checks if a device hash has already created a `FREE` account.
    -   Blocks multiple free accounts from the same physical device to prevent trial abuse.
-   **Plan Limits Enforcer:**
    -   `User` model stores cached `planLimits` (e.g., maxProducts: 3).
    -   `POST /api/products` checks current count against this limit before creation.
-   **Abuse Logging:**
    -   Suspicious activities (Multi-account attempts) are logged to `AbuseLog` collection for audit.

---

## 16. BUSINESS RULES & CONSTRAINTS

### Account & Plans
1.  **Strict One-Free-Account Policy:** A single physical device (via fingerprint) can create exactly one `FREE` tier account. Subsequent attempts are blocked.
2.  **Plan Downgrades:** Downgrading from `PRO` to `FREE` is only allowed if the user's current resource usage (products, storage) is within `FREE` tier limits.
3.  **Content Ownership:** Creators retain 100% ownership of their uploaded content. Platform rights are limited to distribution/hosting.

### Financials
1.  **Payout Threshold:** Minimum ₹500 balance required for automated daily payouts.
2.  **Refund Window:** Learning products (Courses) have a 7-day refund policy if <30% consumed. Digital downloads are non-refundable once accessed.
3.  **Platform Fee:** Flat 5% transaction fee on `FREE` tier. 0% on `PRO`.

---

## 17. FAILURE SCENARIOS & RECOVERY

### Payment Webhooks
-   **Scenario:** Razorpay webhook fails (500 Error or Timeout).
-   **Impact:** Order marked as `PENDING`, user charged but product not delivered.
-   **Recovery:**
    1.  Razorpay retries webhook with exponential backoff (up to 24h).
    2.  Idempotency Key (Razorpay Order ID) prevents duplicate `Order` creation.
    3.  User can trigger "Check Status" from dashboard to manually sync state.

### File Delivery System
-   **Scenario:** Cloudinary generation of signed URL fails.
-   **Recovery:**
    1.  API retries 3 times with 500ms delay.
    2.  Fallback to S3 direct signed URL (Secondary bucket).

### Database Consistency
-   **Scenario:** Order created but email fails to send.
-   **Strategy:** "At-least-once" delivery. Email task is queued (Redis/BullMQ in future, currently in-memory `await`).
-   **Fix:** If email fails, the API still returns 200 OK for the purchase. User can view order in Dashboard.

---

## 18. ROLE & PERMISSION MATRIX

| Feature | Guest | User (Free) | Creator (Pro) | Admin |
| :--- | :---: | :---: | :---: | :---: |
| View Storefront | ✅ | ✅ | ✅ | ✅ |
| Buy Product | ✅ | ✅ | ✅ | ✅ |
| Create Product | ❌ | ✅ (Max 3) | ✅ (Unlimited) | ✅ |
| Custom Domain | ❌ | ❌ | ✅ | ✅ |
| View Analytics | ❌ | Basic | Advanced | System-Wide |
| Ban User | ❌ | ❌ | ❌ | ✅ |
| Refund Order | ❌ | ❌ | ✅ (Own) | ✅ (Any) |

---

## 19. DATA CONSISTENCY & IDEMPOTENCY

### Idempotency
-   **Payment Webhooks:** `razorpay_order_id` is the unique key. If a webhook with an existing ID ID arrives, it is logged and ignored to prevent duplicate orders.
-   **Product Creation:** Duplicate submissions blocked by frontend state (disable button) and backend rate limiting.

### Concurrency
-   **Inventory checks:** Uses MongoDB `$inc` atomic operators for physical inventory decrements (`inventoryCount: -1`) to prevent race conditions during high-traffic drops.

---

## 20. RATE LIMITING RULES (PER IP)

| Endpoint | Limit | Window | Purpose |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/*` | 5 req | 1 hour | Prevent brute force & abuse |
| `GET /api/public/*` | 100 req | 1 min | Protect storefronts from scraping |
| `POST /api/products` | 10 req | 1 min | Prevent spam creation |
| `POST /api/upload` | 500 MB | 1 day | Bandwidth management |
| `Global` | 1000 req | 1 min | DDoS mitigation |

---

## 21. OBSERVABILITY & MONITORING

### Logging
-   **Application Logs:** Vercel Runtime Logs (Error/Warn).
-   **Audit Logs:** `AbuseLog` collection in MongoDB for security events.
-   **Payment Logs:** Raw webhook payloads stored for 30 days for debugging disputes.

### Health Checks
-   `/api/health`: Checks DB connection and Redis availability.
-   **Uptime Robot:** External pings every 5 mins.

### Metrics (Future)
-   **Business:** "Orders Per Minute", "Signups Per Hour".
-   **System:** "P95 Response Time", "5xx Error Rate".

---

## 22. COST & SCALING IMPACT

### Cost Drivers
1.  **Vercel:** $20/month base. Scales with bandwidth (Sales).
2.  **MongoDB Atlas:** Free Tier (M0) -> M10 ($59/mo) when >500MB data.
3.  **Cloudinary:** Free Plan (25GB) -> Plus ($99/mo) for heavy video courses.

### Scaling Triggers
-   **10k+ Users:** Move Redis from Upstash Free to Pay-as-you-go.
-   **100GB+ Media:** Migrate video hosting to Mux or AWS S3 + CloudFront.
-   **High Concurrency:** Upgrade MongoDB to dedicated cluster for IOPS.


### Security Risks & Mitigations
-   **XSS:** React escapes content by default. CSP headers in `next.config.ts` restrict script sources.
-   **CSRF:** NextAuth handles CSRF tokens. State-changing requests verify this token.
-   **Injection:** Mongoose (ODM) prevents NoSQL injection. Zod validates strict schemas.
-   **Rate Limiting:** Redis tracking prevents brute force on login and API abuse.

---

## 9. API CONTRACTS

### `GET /api/user/profile`
-   **Purpose:** Get logged-in user details.
-   **Request:** `headers: { Cookie: session-token }`
-   **Response:**
    ```json
    { "user": { "id": "123", "name": "Alice", "role": "creator" } }
    ```
-   **Error:** 401 Unauthorized.

### `POST /api/products`
-   **Purpose:** Create product.
-   **Request:**
    ```json
    { "name": "My Ebook", "price": 100, "type": "digital" }
    ```
-   **Response:**
    ```json
    { "success": true, "productId": "prod_789" }
    ```
-   **Error:** 400 Bad Request (Validation failed).

### `POST /api/payments/webhook`
-   **Purpose:** Razorpay callback.
-   **Request:** Raw JSON body + `x-razorpay-signature` header.
-   **Response:** `{ "status": "ok" }`

---

## 10. CONFIGURATION & ENVIRONMENT

### Environment Variables (.env.local)
-   `MONGODB_URI`: *Secret*. Connection string.
-   `NEXTAUTH_SECRET`: *Secret*. JWT signing key.
-   `NEXTAUTH_URL`: *Public*. https://creatorly.in
-   `RAZORPAY_KEY_ID`: *Public*.
-   `RAZORPAY_KEY_SECRET`: *Secret*.
-   `CLOUDINARY_*`: *Secret*. Asset management keys.

### Secrets Handling
-   Secrets are NEVER committed to git.
-   In Vercel, they are stored in Project Settings > Environment Variables.
-   `next.config.ts` manages public headers and non-sensitive config.

---

## 11. BUILD & DEPLOYMENT PIPELINE

### Build Steps (`npm run build`)
1.  **Next Build:** Compiles React components and API routes.
2.  **Linting:** Runs ESLint.
3.  **Type Check:** Runs TypeScript compiler.
4.  **Static Generation:** Prerenders static pages (Landing page, Legal pages).

### Hosting (Vercel)
-   **CI/CD:** Pushing to `main` branch triggers Vercel.
-   **Preview:** Pushing to other branches creates a Preview Deployment URL.
-   **Production:** `main` branch deploys to `creatorly.in`.

### Deployment Flow
1.  Developer pushes code.
2.  Vercel detects commit.
3.  Vercel clones repo.
4.  Installs dependencies (`npm ci`).
5.  Runs Build.
6.  If success -> Promotes to Production Edge Network.
7.  If fail -> Keeps previous version active.

---

## 12. ERROR HANDLING & LOGGING

### Capturing Errors
-   **Frontend:** `ErrorBoundary.tsx` wraps the app to catch rendering crashes. `toast.error()` displays API errors to users.
-   **Backend:** `try/catch` blocks in every route.
-   **Global:** `error.tsx` in Next.js App Router handles fatal route errors.

### Logging Strategy
-   **Dev:** `console.log` and `console.error` output to terminal.
-   **Prod:** `console.error` is captured by Vercel's Log Drains.
-   **User-Facing:** Generic messages ("Something went wrong") to avoid leaking internal stack traces.

---

## 13. PERFORMANCE & SCALABILITY

### Bottlenecks
-   **Database:** MongoDB connection limits. *Mitigation: Connection pooling.*
-   **Cold Starts:** Serverless functions can take 1-2s to start. *Mitigation: Vercel Edge Functions for critical paths.*

### Optimization
-   **Images:** `next/image` lazy loads and formats images.
-   **Fonts:** `next/font` reduces layout shift.
-   **Caching:** Static pages are cached on CDN. API responses use `Cache-Control` headers where appropriate.

### Scalability
-   **Horizontal:** The app scales automatically via Vercel's serverless infrastructure.
-   **Database:** MongoDB Atlas handles scaling storage and throughput.

---

## 14. MAINTENANCE & EXTENSION GUIDE

### Adding Features
1.  **Plan:** Define data model changes.
2.  **Backend:** Implement API route and Service logic.
3.  **Frontend:** Create UI components.
4.  **Test:** Verify locally.

### Debugging
-   **Local:** Run `npm run dev`. Connect to local MongoDB or dev cluster.
-   **Prod:** Check Vercel Logs. Filter by "Error".

### Conventions
-   **Styling:** Use Tailwind utility classes.
-   **Imports:** Use absolute imports `@/components/...`.
-   **Types:** Always define interfaces in `src/types` or co-located with models.

---

## 15. FINAL SYSTEM WALKTHROUGH

**Scenario: A Creator Sells a PDF**

1.  **Setup:**
    *   Creator logs in -> Dashboard.
    *   Clicks "Products" -> "New".
    *   Uploads PDF. Backend stores it securely.
    *   Sets Price ₹499.

2.  **Purchase:**
    *   Fan visits `creatorly.in/u/creator`.
    *   Clicks "Buy Now" on the PDF product.
    *   Enters email.
    *   **Razorpay** modal opens.
    *   Fan pays via UPI.

3.  **Fulfillment:**
    *   Razorpay calls `POST /api/payments/webhook`.
    *   Backend verifies signature.
    *   Backend creates `Order` in MongoDB using `Product` and `User` models.
    *   Backend sends "Download Your File" email via Resend.

4.  **Consumption:**
    *   Fan clicks link in email.
    *   Link goes to `creatorly.in/download/...`.
    *   Backend verifies order ownership.
    *   Backend generates temporary signed URL.
    *   Fan downloads PDF.
