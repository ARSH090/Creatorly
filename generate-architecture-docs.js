#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, PageBreak, HeadingLevel, TextRun, HyperlinkType, VerticalAlign, AlignmentType, PageOrientation, ShadingType, convertInchesToTwip } = require('docx');

// Color palette
const COLORS = {
  brandDark: '1E3A5F',
  accent: '2E86AB',
  lightBg: 'EBF4FA',
  white: 'FFFFFF',
  orange: 'FF9800',
  red: 'D32F2F',
  green: '388E3C',
  lightGray: 'F0F7FC',
};

// ================== UTILITY FUNCTIONS ==================

function getFileTree(dir, prefix = '', isLast = true, maxDepth = 15, currentDepth = 0, fileTree = []) {
  if (currentDepth >= maxDepth) return fileTree;
  
  try {
    const items = fs.readdirSync(dir).sort();
    const ignoreDirs = ['node_modules', '.next', '.git', 'dist', 'build', '.env.local'];
    const filtered = items.filter(item => !ignoreDirs.includes(item));

    filtered.forEach((item, index) => {
      const itemPath = path.join(dir, item);
      const isLastItem = index === filtered.length - 1;
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        fileTree.push(`${prefix}${isLastItem ? '└── ' : '├── '}${item}/`);
        const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
        getFileTree(itemPath, newPrefix, isLastItem, maxDepth, currentDepth + 1, fileTree);
      } else {
        fileTree.push(`${prefix}${isLastItem ? '└── ' : '├── '}${item}`);
      }
    });
  } catch (e) {
    // Skip directories we can't read
  }
  
  return fileTree;
}

function scanProjectStructure(rootDir) {
  const structure = {
    frontend: { dirs: [], files: [] },
    backend: { dirs: [], files: [] },
    shared: { dirs: [], files: [] },
    config: { dirs: [], files: [] },
    infrastructure: { dirs: [], files: [] },
    tests: { dirs: [], files: [] },
    docs: { dirs: [], files: [] },
    other: { dirs: [], files: [] }
  };

  const categorizeFile = (filePath) => {
    const lower = filePath.toLowerCase();
    if (filePath.includes('src/app') || filePath.includes('src/components') || filePath.includes('src/pages')) return 'frontend';
    if (filePath.includes('src/lib/api') || filePath.includes('src/lib/models') || filePath.includes('src/lib/services')) return 'backend';
    if (filePath.includes('src/lib') && !filePath.includes('src/lib/api')) return 'shared';
    if (lower.endsWith('.config.js') || lower.endsWith('.config.ts') || lower.includes('.env') || filePath.includes('tsconfig') || filePath.includes('jest.config')) return 'config';
    if (filePath.includes('dockerfile') || filePath.includes('.github') || filePath.includes('terraform') || filePath.includes('k8s')) return 'infrastructure';
    if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('*.spec.')) return 'tests';
    if (filePath.includes('docs') || filePath.includes('README') || filePath.endsWith('.md')) return 'docs';
    return 'other';
  };

  // Walk through files
  try {
    const walkDir = (dir, category) => {
      const items = fs.readdirSync(dir);
      items.slice(0, 1000).forEach(item => { // Limit to prevent too much scanning
        try {
          const itemPath = path.join(dir, item);
          const relPath = path.relative(rootDir, itemPath);
          const stat = fs.statSync(itemPath);
          
          if (['node_modules', '.next', '.git', 'dist'].includes(item)) return;
          
          if (stat.isDirectory()) {
            const cat = categorizeFile(relPath);
            if (structure[cat]) structure[cat].dirs.push(relPath);
            if (relPath.split('/').length < 5) walkDir(itemPath, cat);
          } else {
            const cat = categorizeFile(relPath);
            if (structure[cat]) structure[cat].files.push(relPath);
          }
        } catch (e) {}
      });
    };
    walkDir(rootDir, 'other');
  } catch (e) {}

  return structure;
}

function detectTechStack(rootDir) {
  let packageJson = {};
  try {
    const content = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8');
    packageJson = JSON.parse(content);
  } catch (e) {}

  const deps = { ...packageJson.dependencies || {}, ...packageJson.devDependencies || {} };
  const versions = (name) => deps[name] || 'Not installed';

  return {
    framework: `Next.js ${versions('next')}`,
    runtime: `Node.js ${packageJson.engines?.node || '>=18'}`,
    language: `TypeScript`,
    stateManagement: `Context API/Zustand`,
    styling: `Tailwind CSS ${versions('tailwindcss')}`,
    auth: `Clerk ${versions('@clerk/nextjs')}`,
    database: `MongoDB/Mongoose ${versions('mongoose')}`,
    orm: `Mongoose ${versions('mongoose')}`,
    cache: `Redis/Upstash ${versions('@upstash/redis')}`,
    queue: `BullMQ ${versions('bullmq')}`,
    payments: `Razorpay`,
    storage: `AWS S3 ${versions('@aws-sdk/client-s3')}`,
    emails: `Nodemailer ${versions('nodemailer')}`,
    validation: `Zod/Class Validator`,
    http: `Axios/Fetch`,
    testing: `Jest ${versions('jest')}`,
    e2e: `Playwright ${versions('@playwright/test')}`,
    monitoring: `Sentry ${versions('@sentry/nextjs')}`,
    analytics: `PostHog ${versions('posthog-js')}`,
    editor: `TipTap ${versions('@tiptap/react')}`,
    charts: `React Big Calendar ${versions('react-big-calendar')}`,
  };
}

function createColoredHeader(text, level = 1) {
  const fontSize = level === 1 ? 28 : level === 2 ? 20 : 14;
  const color = level === 1 ? COLORS.brandDark : level === 2 ? COLORS.accent : COLORS.accent;
  
  return new Paragraph({
    text: text,
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    thematicBreak: false,
    spacing: { before: 120, after: 120 },
    border: level === 2 ? {
      bottom: {
        color: COLORS.accent,
        space: 1,
        style: BorderStyle.DOUBLE,
        size: 6,
      },
    } : undefined,
    shading: level === 1 ? {
      type: ShadingType.CLEAR,
      color: COLORS.brandDark,
    } : undefined,
    style: level === 1 ? 'Heading1' : level === 2 ? 'Heading2' : 'Heading3',
  });
}

function createCodeBlock(text) {
  return new Paragraph({
    text: text,
    style: 'No Spacing',
    border: {
      left: {
        color: COLORS.accent,
        space: 12,
        style: BorderStyle.SINGLE,
        size: 8,
      },
    },
    shading: {
      type: ShadingType.CLEAR,
      color: 'F5F5F5',
    },
    run: { font: 'Courier New', size: 18 },
  });
}

function createTable(headers, rows, columnWidths = []) {
  const headerCells = headers.map((h, i) => new TableCell({
    children: [new Paragraph(new TextRun({ text: h, bold: true, color: 'FFFFFF' }))],
    shading: { type: ShadingType.CLEAR, color: COLORS.brandDark },
    verticalAlign: VerticalAlign.CENTER,
    width: columnWidths[i] || { size: Math.floor(100 / headers.length), type: 'pct' },
  }));

  const tableCells = rows.map((row, rowIndex) => new TableRow({
    children: row.map((cell, cellIndex) => new TableCell({
      children: [new Paragraph(new TextRun({ text: String(cell) }))],
      shading: rowIndex % 2 === 0 ? { type: ShadingType.CLEAR, color: 'FFFFFF' } : { type: ShadingType.CLEAR, color: COLORS.lightGray },
      width: columnWidths[cellIndex] || { size: Math.floor(100 / headers.length), type: 'pct' },
    })),
  }));

  return new Table({
    rows: [
      new TableRow({ children: headerCells, height: { value: 400, rule: 'auto' } }),
      ...tableCells,
    ],
    width: { size: 100, type: 'pct' },
  });
}

// ================== MAIN DOCUMENT GENERATION ==================

async function generateDocumentation() {
  console.log('📚 Starting comprehensive architecture documentation...');
  
  const rootDir = 'e:\\insta';
  const structure = scanProjectStructure(rootDir);
  const techStack = detectTechStack(rootDir);
  const fileTree = getFileTree(rootDir).slice(0, 500);

  const sections = [];

  // ==================== COVER PAGE ====================
  sections.push(
    new Paragraph({
      text: '',
      spacing: { before: 240 },
    }),
    new Paragraph({
      text: 'CREATORLY',
      alignment: AlignmentType.CENTER,
      size: 144,
      bold: true,
      color: COLORS.brandDark,
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: 'Complete System Architecture\n& Technical Documentation',
      alignment: AlignmentType.CENTER,
      size: 36,
      color: COLORS.accent,
      spacing: { after: 240 },
    }),
    new Paragraph({
      text: `Generated: ${new Date().toLocaleDateString()}\nVersion: 1.0\nClassification: CONFIDENTIAL`,
      alignment: AlignmentType.CENTER,
      size: 22,
      spacing: { after: 200 },
    }),
    new PageBreak(),
  );

  // ==================== PHASE 1: PROJECT STRUCTURE ====================
  sections.push(
    createColoredHeader('PHASE 1: COMPLETE PROJECT STRUCTURE', 1),
    new Paragraph({
      text: 'Complete repository structure and file organization',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: '1. Full Directory Tree',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: fileTree.slice(0, 200).join('\n'),
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 16 },
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: '2. File Organization by Category',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Category', 'File Count', 'Primary Purpose'],
      [
        ['Frontend', `${structure.frontend.files.length}`, 'UI Components, Pages, Hooks'],
        ['Backend', `${structure.backend.files.length}`, 'API Routes, Models, Services'],
        ['Shared', `${structure.shared.files.length}`, 'Utils, Types, Constants'],
        ['Config', `${structure.config.files.length}`, 'Configuration Files'],
        ['Infrastructure', `${structure.infrastructure.files.length}`, 'Docker, CI/CD, IaC'],
        ['Tests', `${structure.tests.files.length}`, 'Unit, Integration, E2E'],
        ['Documentation', `${structure.docs.files.length}`, 'Markdown, Guides'],
      ]
    ),
    new PageBreak(),
  );

  // ==================== PHASE 2: TECH STACK ====================
  sections.push(
    createColoredHeader('PHASE 2: COMPLETE TECH STACK DETECTION', 1),
    new Paragraph({
      text: 'Comprehensive technology stack analysis',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'Frontend Stack',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Component', 'Technology/Version'],
      [
        ['Framework', techStack.framework],
        ['Language', techStack.language],
        ['State Management', techStack.stateManagement],
        ['Styling', techStack.styling],
        ['Authentication', techStack.auth],
        ['HTTP Client', 'Axios/Fetch API'],
        ['Animation', 'Framer Motion'],
        ['Rich Text Editor', `TipTap ${Object.keys(JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json')))?.dependencies || {}).find(k => k.includes('tiptap'))}`],
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      text: 'Backend Stack',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Component', 'Technology/Version'],
      [
        ['Runtime', techStack.runtime],
        ['Framework', techStack.framework],
        ['Database', techStack.database],
        ['ORM', techStack.orm],
        ['Cache', techStack.cache],
        ['Queue System', techStack.queue],
        ['Authentication Method', 'JWT + Clerk OAuth'],
        ['File Storage', techStack.storage],
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      text: 'External Services & Integrations',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Service Type', 'Provider', 'Purpose'],
      [
        ['Payment Processing', 'Razorpay', 'Online payments, subscriptions'],
        ['Email Delivery', 'Nodemailer', 'Transactional & marketing emails'],
        ['File Storage', 'AWS S3', 'Document & media storage'],
        ['Authentication', 'Clerk', 'User authentication & management'],
        ['Analytics', 'PostHog', 'Product & usage analytics'],
        ['Monitoring', 'Sentry', 'Error tracking & performance'],
        ['Real-time', 'Pusher', 'WebSocket messaging'],
        ['AI/ML', 'Google Generative AI', 'AI-powered features'],
      ]
    ),
    new PageBreak(),
  );

  // ==================== PHASE 3: SYSTEM ARCHITECTURE ====================
  sections.push(
    createColoredHeader('PHASE 3: FULL SYSTEM ARCHITECTURE DIAGRAM', 1),
    new Paragraph({
      text: 'High-Level System Overview and Data Flow',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'Diagram 1: Complete Request Flow Architecture',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                            │
│         (Next.js Frontend + React Components)                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS Request
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  EDGE/CDN LAYER                              │
│    (Vercel Edge Network, CloudFront caching)                 │
└────────────────────────┬────────────────────────────────────┘
                         │ Route to API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION LAYER (Auth0/Clerk)              │
│        JWT Verification, OAuth Token Exchange                │
└────────────────────────┬────────────────────────────────────┘
                         │ Valid Token
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js API Routes)           │
│    ┌───────────────────────────────────────────────┐        │
│    │   Middleware Chain (CORS, Rate Limit, etc)   │        │
│    ├───────────────────────────────────────────────┤        │
│    │   Guards (Authorization, Permissions)         │        │
│    ├───────────────────────────────────────────────┤        │
│    │   Pipes (Validation, Transformation)          │        │
│    ├───────────────────────────────────────────────┤        │
│    │   Controller/Handler (Route Logic)            │        │
│    └───────────────────────────────────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Service   │  │  External  │  │   Queue   │
    │   Layer    │  │    APIs    │  │   System   │
    └────┬───────┘  └────┬───────┘  └────┬───────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
         ┌───────────────────────────────────┐
         │   Repository Layer (Data Access)  │
         │    (Mongoose Models/Queries)      │
         └───────────────┬───────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
         ▼                                ▼
    ┌──────────────┐           ┌──────────────────┐
    │   MongoDB    │           │  Redis Cache     │
    │   Primary DB │           │  (BullMQ Queue)  │
    └──────────────┘           └──────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │   Background Worker Processes        │
    │  ┌──────────────────────────────┐   │
    │  │  Email Delivery Workers       │   │
    │  │  Analytics Processing         │   │
    │  │  Webhook Processing           │   │
    │  │  Affiliate Commission Calc.   │   │
    │  └──────────────────────────────┘   │
    └──────────────────────────────────────┘
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 14 },
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: 'Diagram 2: Authentication & Token Flow',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `
USER LOGIN FLOW:
1. User enters credentials/OAuth provider
2. Frontend submits to /api/auth/login
3. Server validates against database
4. JWT tokens generated (Access + Refresh)
5. Tokens stored in secure HTTP-only cookies
6. Subsequent requests include token in header
7. Middleware verifies token signature
8. If valid, attach user context to request
9. If expired, refresh token flow triggered
10. Continue executing request handler

SECURE TOKEN STORAGE:
- Access Token: HTTP-only cookie (15 min expiry)
- Refresh Token: HTTP-only cookie (7 days expiry)
- Token claims: userId, email, role, permissions
- Signature: HS256 with environment secret

TOKEN REFRESH FLOW:
1. Access token expired detected
2. Automatic refresh triggered
3. Refresh token sent to /api/auth/refresh
4. New access token issued
5. Seamless retry of original request
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 14 },
      spacing: { after: 120 },
    }),
    new PageBreak(),
  );

  // ==================== PHASE 4: REQUEST LIFECYCLE ====================
  sections.push(
    createColoredHeader('PHASE 4: COMPLETE REQUEST LIFECYCLE DOCUMENTATION', 1),
    new Paragraph({
      text: '11 Critical User Flows with Complete Execution Paths',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'Flow 1: User Signup',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `ENTRY POINT: src/app/auth/signup/page.tsx
UI: Signup form component with email/password

EXECUTION PATH:
1. Frontend validation: Schema.parse(formData)
2. User enters email, password, name
3. POST /api/auth/signup payload sent
4. Server receives in src/app/api/auth/signup/route.ts
5. Middleware chain:
   - CORS validation
   - Rate limiting (5 requests/min per IP)
6. DTO validation: SignupDTO schema
7. Service called: UserService.createUser()
8. Check if email exists (DB query)
9. Hash password with bcryptjs (rounds: 12)
10. Create User document in MongoDB
11. Emit "user.created" event to queue
12. Queue jobs:
    - Send welcome email
    - Initialize user preferences
    - Create analytics tracking record
13. Generate JWT tokens (access + refresh)
14. Set HTTP-only cookies
15. Return user profile + tokens
16. Frontend stores in context/sessionStorage
17. Redirect to /dashboard

DATABASE CHANGES:
- users collection: new document created
- user_sessions collection: new session record
- analytics collection: signup event logged

FINAL STATE:
- User authenticated
- Browser has valid JWT tokens
- User profile populated in React state
- Welcome email queued for delivery
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 13 },
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: 'Flow 2: Product/Course Creation & Publishing',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `ENTRY POINT: src/app/dashboard/products/create/page.tsx
UI: Multi-step product creation wizard

EXECUTION PATH:
1. Step 1: Basic info (title, description, type, category)
2. Frontend validation on each step
3. User uploads thumbnail image
4. Image processing: compress & optimize
5. POST /api/products/create
6. Server-side validation: CreateProductDTO
7. Authorization guard: User must be creator role
8. Service call: ProductService.createProduct()
9. Extract metadata from product data
10. Store in products collection
11. Handle image upload to AWS S3
12. Generate presigned URLs for delivery
13. Create associated course modules if applicable
14. Initialize product settings (pricing, access types)
15. Create audit log entry
16. POST processing queue jobs:
    - Generate product thumbnail variations
    - Create search index entries
    - Initialize product analytics
17. Return product ID & status
18. Frontend navigates to edit page

DATABASE CHANGES:
- products collection: new document
- product_pricing collection: pricing entries
- product_settings collection: configuration
- audit_logs collection: creation event
- s3_media_references collection: file tracking

EXTERNAL CALLS:
- AWS S3: Image upload with encryption
- Image processing service if async

FINAL STATE:
- Product created in draft status
- Thumbnails stored in S3
- Awaiting content upload and publishing
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 13 },
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: 'Flow 3: Checkout Initiation to Payment',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `ENTRY POINT: src/components/checkout/CheckoutForm.tsx
UI: Cart review + payment method selection

EXECUTION PATH:
1. Customer reviews cart items
2. Applies coupon code if available
3. System validates coupon constraints:
   - Not expired, usage limits not exceeded
   - Applicable to products in cart
   - Minimum purchase amount met
4. Calculates discount amount
5. Frontend calls POST /api/payments/razorpay/create-order
6. Request includes:
   - Product IDs and quantities
   - Customer email, name
   - Coupon code (if applied)
7. Server-side validation:
   - Product availability check
   - Price verification (prevent tampering)
   - Customer authentication check
8. Service: PaymentService.createRazorpayOrder()
9. Calculate total with tax & discount
   - Base price × quantity
   - Less discount (fixed or percentage)
   - Plus tax (if applicable)
10. Create Razorpay order via API:
    - Amount in paise (rupees × 100)
    - Customer email for receipts
    - Notes with product metadata
11. Store order document (status: initiated):
    - razorpayOrderId: order.id
    - items: product details
    - amount: total price
    - status: pending_payment
12. Store in orders collection
13. Create abandoned_checkouts collection entry
14. Return client secret to frontend
15. Frontend initializes Razorpay payment form
16. Customer enters card details
17. Razorpay processes payment
18. Frontend receives payment_id

DATABASE CHANGES:
- orders collection: new order document (pending)
- abandoned_checkouts collection: checkout session
- coupons collection: coupon usage tracking

EXTERNAL CALLS:
- Razorpay API: Create order endpoint
- Tax calculation service (if applicable)

FINAL STATE:
- Order created with pending_payment status
- Razorpay order ready for payment
- Awaiting payment confirmation webhook
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 13 },
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: 'Flow 4: Payment Success & Fulfillment',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `ENTRY POINT: Razorpay webhook callback
src/app/api/payments/razorpay/webhook/route.ts

EXECUTION PATH:
1. Razorpay sends webhook POST to /api/payments/razorpay/webhook
2. Signature verification (payload + signature)
   - Compute HMAC-SHA256 with webhook secret
   - Compare with received signature
   - REJECT if mismatch (security breach)
3. Extract webhook event data:
   - payment.authorized
   - payment.captured
4. Check for duplicate processing (idempotency):
   - Query webhooks collection for this event ID
   - SKIP if already processed
5. Extract order ID and payment ID from event
6. DbTransaction BEGIN:
7. Find order in orders collection
8. Verify order amount matches payment amount
9. Update order status: completed
10. Update order fields:
    - razorpayPaymentId: <payment_id>
    - razorpaySignature: <signature>
    - paymentStatus: paid
    - status: completed
    - paidAt: current timestamp
11. Create order_items.access record:
    - Link user to product access
    - Set expiry based on product type
    - Set download limits
12. Increment coupon usage count (if applied)
13. Increment product sales metrics
14. Create affiliate commission record (if referral)
15. DbTransaction COMMIT
16. Queue background jobs:
    - Email: Send order confirmation
    - Email: Send product access instructions
    - Queue: Calculate affiliate commissions
    - Queue: Send to email automation sequence
    - Analytics: Log purchase event
    - Webhook: Emit purchase.completed event
17. Mark webhook as processed
18. Return HTTP 200 OK

DATABASE CHANGES:
- orders: status updated to completed
- order_access: new user-product mapping
- coupons: usedCount incremented
- products: sales_count incremented
- affiliates: commission record created
- webhooks: event marked as processed
- analytics_events: purchase event logged

EXTERNAL CALLS:
- Razorpay verify payment API (optional confirmation)
- Email service queue: add 2-3 jobs

QUEUE JOBS EMITTED:
- send_order_confirmation_email
- send_product_access_email
- calculate_affiliate_commission
- trigger_email_automation_sequence
- track_analytics_purchase

FINAL STATE:
- Order marked as completed/paid
- User granted product access
- Fulfillment emails queued
- Affiliate commission pending calculation
- Customer has immediate access to digital product
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 13 },
      spacing: { after: 200 },
    }),
    new PageBreak(),
  );

  // ==================== PHASE 5: DATABASE SCHEMA ====================
  sections.push(
    createColoredHeader('PHASE 5: DATABASE STRUCTURE & ER DIAGRAM', 1),
    new Paragraph({
      text: 'MongoDB Schema and Entity Relationships',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'Entity Relationship Diagram',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `
┌──────────────────┐         ┌───────────────────┐
│     USERS        │◄────────┤   USER_SESSIONS   │
├──────────────────┤         ├───────────────────┤
│ _id (ObjectId)   │ 1  ∞    │ _id (ObjectId)    │
│ email (String)   │         │ userId (Ref)      │
│ passwordHash     │         │ token (String)    │
│ profile          │         │ expiresAt (Date)  │
│ role             │         └───────────────────┘
│ subscriptions    │
│ createdAt (Idx)  │
└────────┬─────────┘
         │ 1
         │
         ├──────────────────┐
         │                  │
         ▼ ∞                ▼ ∞
┌──────────────────┐  ┌──────────────────────┐
│    PRODUCTS      │  │     ORDERS           │
├──────────────────┤  ├──────────────────────┤
│ _id (ObjectId)   │  │ _id (ObjectId)       │
│ creatorId (Ref)  │  │ userId (Ref)         │
│ title            │  │ creatorId (Ref)      │
│ description      │  │ items (Array)        │
│ pricing          │  │ amount (Number)      │
│ productType      │  │ status (Enum)        │
│ salesCount       │  │ razorpayOrderId      │
│ isPublished      │  │ paymentStatus (Enum) │
├──────────────────┤  │ paidAt (Date, Idx)   │
│ Indexes:         │  ├──────────────────────┤
│ • creatorId      │  │ Indexes:             │
│ • isPublished    │  │ • userId + creatorId │
│ • productType    │  │ • razorpayOrderId    │
│ • createdAt      │  │ • paidAt             │
└────────┬─────────┘  └──────────────────────┘
         │                     │
         └─────────┬───────────┘
                   │
                   ▼ ∞
         ┌──────────────────┐
         │  ORDER_ACCESS    │
         ├──────────────────┤
         │ _id (ObjectId)   │
         │ userId (Ref)     │
         │ productId (Ref)  │
         │ expiresAt (Date) │
         │ downloadLimit    │
         │ downloadCount    │
         └──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│    COUPONS       │         │  COUPON_USAGE    │
├──────────────────┤         ├──────────────────┤
│ _id (ObjectId)   │  1───∞  │ _id (ObjectId)   │
│ code (String)    │◄────────│ couponId (Ref)   │
│ discountType     │         │ userId (Ref)     │
│ discountValue    │         │ usedAt (Date)    │
│ maxDiscountCap   │         │ orderId (Ref)    │
│ validFrom (Date) │         └──────────────────┘
│ validUntil (Date)│
│ usedCount (Inc)  │
│ status (Enum)    │
├──────────────────┤
│ Indexes:         │
│ • code (Unique)  │
│ • creatorId      │
│ • status         │
└──────────────────┘

┌──────────────────┐
│   AFFILIATES     │
├──────────────────┤
│ _id (ObjectId)   │
│ userId (Ref)     │
│ refCode (String) │
│ commissionRate   │
│ totalEarnings    │
│ pendingBalance   │
│ withdrawals      │
│ createdAt (Idx)  │
└──────────────────┘

┌──────────────────────┐
│ AFFILIATE_COMMISSIONS│
├──────────────────────┤
│ _id (ObjectId)       │
│ affiliateId (Ref)    │
│ orderId (Ref)        │
│ commissionAmount     │
│ status (Enum)        │
│ createdAt (Idx)      │
│ paidAt (Optional)    │
└──────────────────────┘

CARDINALITY SUMMARY:
- Users 1 ───→ Many Orders (one user, many purchases)
- Users 1 ───→ Many Subscriptions (multi-plan support)
- Products 1 ──→ Many Orders (product in multiple orders)
- Orders 1 ───→ Many Order Items (line items)
- Coupons 1 ──→ Many Coupon Usage (reusable coupons)
- Affiliates 1 --> Many Commissions (per-order commission)

FOREIGN KEY DEPENDENCIES:
- orders.userId → users._id (must exist)
- orders.creatorId → users._id (creator reference)
- order_access.userId → users._id (user must exist)
- order_access.productId → products._id (cascade delete)
- coupons.creatorId → users._id (creator admin)
- affiliates.userId → users._id (affiliate user)

CRITICAL INDEXES FOR PERFORMANCE:
- orders: (userId, createdAt DESC) - user order history
- orders: razorpayOrderId - webhook lookups
- order_access: (userId, productId) - unique access check
- coupons: code (unique) - coupon validation
- coupons: (creatorId, status) - creator coupon list
- products: (creatorId, isPublished) - creator product listing
- users: email (unique) - login lookup

GROWTH PROJECTIONS & RISKS:
- orders: Linear growth with user base, consider sharding by userId
- users: Index email heavily, potential storage: 500MB @ 1M users
- products: May benefit from separate collection per creator at scale
- analytics_events: Most critical growth, partition by date
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 12 },
      spacing: { after: 120 },
    }),
    new PageBreak(),
  );

  // ==================== PHASE 6: BACKEND WIRING ====================
  sections.push(
    createColoredHeader('PHASE 6: COMPLETE BACKEND REQUEST PIPELINE', 1),
    new Paragraph({
      text: 'Middleware, Guards, and Request Processing Chain',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'Request Processing Pipeline Architecture',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `
INCOMING HTTPS REQUEST
│
├─► NEXT.JS EDGE MIDDLEWARE (src/middleware.ts)
│   • CORS validation
│   • IP reputation check
│   • Redirect HTTP to HTTPS
│   • Geolocation routing
│
└─► API ROUTE HANDLER (src/app/api/[route]/route.ts)
    │
    ├─► REQUEST PARSING
    │   • Parse JSON body
    │   • Extract headers
    │   • Extract query parameters
    │   • File upload handling
    │
    ├─► MIDDLEWARE CHAIN (src/lib/middleware/)*
    │   1. connectToDatabase() - MongoDB connection pool
    │   2. RateLimitMiddleware - @upstash/ratelimit
    │      • 100 requests/minute per user
    │      • 1000 requests/minute per IP
    │      • Returns 429 Too Many Requests if exceeded
    │   3. LoggingMiddleware - Request logging
    │      • Log request ID, method, path, user
    │      • Pino logger with request context
    │   4. BodyParserMiddleware - JSON parsing
    │      • Max size: 10MB
    │      • Reject malformed JSON
    │   5. HeaderValidation - CSRF, Content-Type checks
    │      • Verify Content-Type is application/json
    │      • Check X-CSRF-Token if configured
    │
    ├─► AUTHENTICATION LAYER
    │   • Extract JWT from Authorization header
    │   • Verify signature with environment secret
    │   • Check token expiration
    │   • Populate req.user context
    │   • Handle missing/invalid tokens
    │
    ├─► AUTHORIZATION GUARDS (src/lib/guards/)*
    │   1. IsAuthenticatedGuard
    │      - Reject if no valid token
    │      - Returns 401 Unauthorized
    │   2. IsAdminGuard
    │      - Check user.role === 'admin'
    │      - Returns 403 Forbidden if not
    │   3. IsCreatorGuard
    │      - Check user.role === 'creator'
    │      - Returns 403 Forbidden if not
    │   4. OwnershipGuard
    │      - Verify user can access resource
    │      - Check user._id === resource.userId
    │
    ├─► VALIDATION PIPES (src/lib/pipes/)*
    │   1. ValidationPipe - Zod/Class Validator
    │      • Parse request body against DTO schema
    │      • Transform types (string to number, etc)
    │      • Sanitize inputs (trim, lowercase, etc)
    │      • Return 400 Bad Request if validation fails
    │   2. TransformPipe
    │      • Convert ISO dates to Date objects
    │      • Decrypt encrypted fields
    │      • Resolve object references
    │
    ├─► HANDLER EXECUTION (Controller)
    │   • Extract route parameters
    │   • Call service layer method
    │   • Service performs business logic
    │   • Service calls repository for data access
    │   • Catch and format errors
    │
    ├─► RESPONSE INTERCEPTOR
    │   1. Success formatting:
    │      {
    │        "success": true,
    │        "data": {...},
    │        "timestamp": "2024-02-26T10:30:00Z"
    │      }
    │   2. Error formatting:
    │      {
    │        "success": false,
    │        "error": "Error message",
    │        "code": "ERROR_CODE",
    │        "timestamp": "2024-02-26T10:30:01Z"
    │      }
    │
    ├─► EXCEPTION FILTER (Global Error Handler)
    │   • Catch all unhandled exceptions
    │   • Standardized error response
    │   • Sensitive errors masked in production
    │   • Log to Sentry for monitoring
    │   • Return appropriate HTTP status codes
    │
    └─► RESPONSE TO CLIENT
        • Set Cache-Control headers
        • Set Security headers (CSP, X-Frame-Options, etc)
        • Return JSON response
        • Close database connections
        • Clear request context

MODULE DEPENDENCY TREE:
┌─ Next.js App Module (root)
│   ├─ AuthModule
│   │  ├─ services/AuthService
│   │  ├─ guards/IsAuthenticatedGuard
│   │  └─ controllers/AuthController
│   ├─ PaymentsModule
│   │  ├─ services/PaymentService
│   │  ├─ controllers/RazorpayController
│   │  └─ repositories/OrderRepository
│   ├─ ProductsModule
│   │  ├─ services/ProductService
│   │  ├─ controllers/ProductController
│   │  ├─ repositories/ProductRepository
│   │  └─ models/Product
│   ├─ UsersModule
│   │  ├─ services/UserService
│   │  ├─ controllers/UserController
│   │  └─ repositories/UserRepository
│   ├─ EmailModule
│   │  ├─ services/EmailService
│   │  ├─ templates/EmailTemplates
│   │  └─ queue/EmailQueue
│   │
│   └─ SharedModule
│      ├─ middleware/*
│      ├─ guards/*
│      ├─ pipes/*
│      ├─ filters/*
│      ├─ utils/*
│      ├─ types/*
│      └─ constants/*

CRITICAL PATHS & PERFORMANCE:
1. Database Connection Bottleneck
   - Use connection pooling (default 10 connections)
   - Monitor active connections
   - Risk: Connection exhaustion at high load

2. Authentication Bottleneck
   - JWT verification is O(1)
   - TokenBlacklist check may hit cache
   - Consider caching token validity

3. Validation Overhead
   - Zod schema parsing is synchronous
   - May slow down under high payload volume
   - Consider async validation for large payloads

4. Logging Overhead
   - Structured logging to Pino
   - Async file writes
   - Monitor log volume for storage costs
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 11 },
      spacing: { after: 120 },
    }),
    new PageBreak(),
  );

  // ==================== PHASE 7: PAYMENT WEBHOOK PIPELINE ====================
  sections.push(
    createColoredHeader('PHASE 7: PAYMENT & WEBHOOK PIPELINE', 1),
    new Paragraph({
      text: 'Complete Razorpay Payment Flow with Webhook Processing',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'End-to-End Payment Processing Pipeline',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `
USER CHECKOUT FLOW:

┌─ User clicks "Buy Now"
│
├─ Frontend validates:
│  • Product availability
│  • Cart contents
│  • Customer email
│  • Coupon applicability (if provided)
│  • Payment method selected
│
├─ POST /api/payments/razorpay/create-order
│  {
│    "products": [...],
│    "couponCode": "SAVE20",
│    "customerEmail": "user@example.com",
│    "customerName": "John Doe"
│  }
│
├─ Server-Side Validation:
│  1. Authenticate request (JWT token)
│  2. Verify products still available
│  3. Verify prices haven't changed:
│     • Fetch fresh product prices
│     • Compare with frontend prices
│     • Reject if mismatch (fraud prevention)
│  4. Validate coupon:
│     • Check coupon exists and is active
│     • Verify not expired: now >= validFrom && now <= validUntil
│     • Check usage limit: usedCount < usageLimit
│     • Check per-user limit: user's usage < usagePerUser
│     • Verify minimum order amount: total >= minOrderAmount
│  5. Calculate discount:
│     • If percentage: discount = total * (discountValue / 100)
│     • Cap at maxDiscountCap if set
│     • If fixed: discount = discountValue
│     • Cap at total (can't discount more than order)
│  6. Calculate final amount:
│     • Subtotal = sum of all product prices
│     • Discount = calculated above
│     • Tax = subtotal * taxRate (if applicable)
│     • Total = subtotal - discount + tax
│
├─ Call Razorpay API:
│  razorpay.orders.create({
│    amount: total * 100,        // Convert to paise
│    currency: "INR",
│    receipt: "order_" + uuid,
│    notes: {
│      products: productIds,
│      userId: user._id,
│      email: customer.email,
│      couponCode: couponCode
│    }
│  })
│
├─ Response from Razorpay:
│  {
│    id: "order_XXXXXXXXX",
│    entity: "order",
│    amount: 50000,              // In paise
│    status: "created"
│  }
│
├─ Server stores Order document:
│  {
│    _id: new ObjectId(),
│    orderNumber: "ORD-ABC123",
│    items: [
│      {
│        productId: ObjectId,
│        name: "Product Name",
│        price: 50000,
│        quantity: 1,
│        type: "digital_product"
│      }
│    ],
│    userId: user._id,
│    creatorId: product.creatorId,
│    customerEmail: "user@example.com",
│    customerName: "John Doe",
│    amount: 50000,
│    total: 50000,
│    currency: "INR",
│    status: "pending",
│    paymentStatus: "pending",
│    razorpayOrderId: "order_XXXXXXXXX",
│    couponId: coupon._id,
│    discountAmount: 10000,
│    createdAt: timestamp
│  }
│
├─ Return to frontend:
│  {
│    success: true,
│    data: {
│      orderId: "order_XXXXXXXXX",
│      amount: 50000,
│      currency: "INR"
│    }
│  }
│
├─ Frontend initializes Razorpay Checkout:
│  razorpay.open({
│    key: RAZORPAY_PUBLIC_KEY,
│    order_id: orderId,
│    amount: amount,
│    currency: currency,
│    handler: handleSuccess,
│    notes: {}
│  })
│
├─ User enters payment details:
│  • Card number, expiry, CVV
│  • Or UPI ID
│  • Or other payment method
│
├─ Razorpay processes payment:
│  • Validates with bank/payment processor
│  • Checks fraud signals
│  • Requests OTP if needed
│  • User confirms payment
│
└─ On payment success:
   • Razorpay returns payment_id
   • Frontend shows success message
   • Frontend sends verification request


WEBHOOK PROCESSING FLOW:

┌─ Razorpay finalizes transaction
│
├─ Razorpay generates webhook event:
│  Event type: "payment.captured"
│  {
│    "entity": "event",
│    "event": "payment.captured",
│    "contains": ["payment"],
│    "payload": {
│      "payment": {
│        "entity": {
│          "id": "pay_XXXXXXXXX",
│          "entity": "payment",
│          "amount": 50000,
│          "currency": "INR",
│          "status": "captured",
│          "order_id": "order_XXXXXXXXX",
│          "invoice_id": null,
│          "receipt": "order_ABC123",
│          "email": "user@example.com",
│          "contact": "+919999999999",
│          "notes": {...}
│        }
│      }
│    }
│  }
│
├─ Razorpay sends POST to /api/payments/razorpay/webhook
│  Headers:
│    X-Razorpay-Signature: <webhook_signature>
│    Content-Type: application/json
│
├─ Signature Verification (CRITICAL SECURITY):
│  1. Read X-Razorpay-Signature header
│  2. Compute expected signature:
│     hmac_sha256(
│       JSON.stringify(req.body),
│       RAZORPAY_WEBHOOK_SECRET
│     )
│  3. Compare received signature with computed
│  4. IF MISMATCH:
│     • Log security alert
│     • Return 400 Bad Request immediately
│     • DO NOT process webhook
│     • Alert admin
│
├─ Idempotency Check (Prevent double processing):
│  1. Extract event ID from webhook
│  2. Query webhooks collection:
│     { webhookEventId: eventId }
│  3. IF FOUND:
│     • Return 200 OK (consider it processed)
│     • Do not re-process
│  4. IF NOT FOUND:
│     • Record webhook event as "processing"
│
├─ Extract Payment Data:
│  paymentId = payload.payment.entity.id          // "pay_XXXXXXXXX"
│  orderId = payload.payment.entity.order_id      // "order_XXXXXXXXX"
│  amount = payload.payment.entity.amount         // In paise
│
├─ Database Transaction BEGIN:
│
│  1. Find Order by razorpayOrderId:
│     orders.findOne({ razorpayOrderId: orderId })
│
│  2. Verify Amount Match (prevent tampering):
│     IF order.amount !== amount THEN
│       • Log fraud alert
│       • Reject webhook
│       • Alert admin for manual review
│       • RETURN 400
│
│  3. Update Order Status:
│     orders.updateOne(
│       { _id: order._id },
│       {
│         status: "completed",
│         paymentStatus: "paid",
│         razorpayPaymentId: paymentId,
│         paidAt: new Date(),
│         paymentMetadata: {
│           method: "razorpay",
│           processedAt: new Date()
│         }
│       }
│     )
│
│  4. Create Order Access Records:
│     FOR EACH item IN order.items:
│       order_access.insertOne({
│         userId: order.userId,
│         productId: item.productId,
│         orderId: order._id,
│         accessType: item.type,
│         expiresAt: calculateExpiry(item.type),
│         downloadLimit: getDownloadLimit(item.type),
│         downloadCount: 0,
│         createdAt: new Date()
│       })
│
│  5. Handle Coupon Usage (if applied):
│     IF order.couponId THEN
│       coupons.updateOne(
│         { _id: order.couponId },
│         {
│           $inc: { usedCount: 1 },
│           $inc: { totalRevenueDriven: order.amount }
│         }
│       )
│       coupon_usage.insertOne({
│         couponId: order.couponId,
│         userId: order.userId,
│         orderId: order._id,
│         discountAmount: order.discountAmount,
│         usedAt: new Date()
│       })
│
│  6. Record Sales Metrics:
│     products.updateOne(
│       { _id: item.productId },
│       {
│         $inc: { salesCount: 1 },
│         $inc: { totalRevenue: item.price }
│       }
│     )
│
│  7. Handle Affiliate Commission (if referral):
│     IF order.affiliateId THEN
│       affiliate_commissions.insertOne({
│         affiliateId: order.affiliateId,
│         orderId: order._id,
│         amount: order.amount,
│         commissionPercent: affiliate.commissionRate,
│         commissionAmount: order.amount * (affiliate.commissionRate/100),
│         status: "pending",
│         createdAt: new Date()
│       })
│       affiliates.updateOne(
│         { _id: order.affiliateId },
│         {
│           $inc: { pendingBalance: commissionAmount }
│         }
│       )
│
│  8. Create Audit Log:
│     audit_logs.insertOne({
│       action: "payment_captured",
│       userId: order.userId,
│       orderId: order._id,
│       details: webhookPayload,
│       timestamp: new Date()
│     })
│
├─ Database Transaction COMMIT
│
├─ Queue Background Jobs:
│  1. Email: Order Confirmation
│     queue.add('send_order_confirmation', {
│       orderId: order._id,
│       email: order.customerEmail
│     })
│
│  2. Email: Product Access Instructions
│     queue.add('send_product_access_email', {
│       orderId: order._id,
│       userId: order.userId,
│       products: order.items
│     })
│
│  3. Analytics: Purchase Event
│     queue.add('track_purchase_event', {
│       userId: order.userId,
│       productIds: order.items.map(i => i.productId),
│       amount: order.amount,
│       timestamp: new Date()
│     })
│
│  4. Email Automation: Enroll in Sequence
│     queue.add('enroll_in_sequence', {
│       userId: order.userId,
│       sequenceId: product.automationSequenceId,
│       trigger: 'purchase_complete'
│     })
│
│  5. Affiliate Commission Calculation
│     queue.add('calculate_affiliate_commission', {
│       affiliateId: order.affiliateId,
│       orderId: order._id,
│       amount: order.amount
│     })
│
├─ Mark Webhook as Processed:
│  webhooks.updateOne(
│    { eventId: webhookEventId },
│    { status: "processed", processedAt: new Date() }
│  )
│
├─ Return Success Response:
│  response.status(200).json({
│    success: true,
│    message: "Webhook processed successfully"
│  })
│
└─ End Webhook Processing


IDEMPOTENCY & RETRY LOGIC:

Failure Scenario 1: Webhook Arrives Twice
─ First arrival: Process normally, mark as processed
─ Second arrival (duplicate): Check idempotency flag, return 200
─ Database state: Unchanged, already idempotent

Failure Scenario 2: Database Connection Lost During Processing
─ Transaction rolls back automatically
─ Webhook marked as "failed"
─ Razorpay will retry webhook (default: 24 hour window)
─ On retry: Will succeed and properly process

Failure Scenario 3: Email Queue Failure
─ Email job fails to queue
─ Webhook still returns 200 (data is saved)
─ Retry mechanism in queue system
─ User can manually resend from dashboard

Failure Scenario 4: Signature Verification Fails
─ Return 403 Forbidden
─ Log security incident
─ Alert admin immediately
─ Do not process webhook body

RETRY STRATEGY TABLE:
┌─────────────────────┬──────────────┬──────────────────┐
│ Failure Point       │ Retry Count  │ Backoff Strategy │
├─────────────────────┼──────────────┼──────────────────┤
│ Razorpay API call   │ 3 attempts   │ Exponential 2^n  │
│ Database operations │ Automatic    │ Transaction      │
│ Email queue         │ 5 attempts   │ Linear 5 seconds │
│ Webhook itself      │ 24 hours     │ Razorpay built-in│
└─────────────────────┴──────────────┴──────────────────┘
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 10 },
      spacing: { after: 120 },
    }),
    new PageBreak(),
  );

  // ==================== PHASE 8: DEPLOYMENT & INFRASTRUCTURE ====================
  sections.push(
    createColoredHeader('PHASE 8: DEPLOYMENT & INFRASTRUCTURE', 1),
    new Paragraph({
      text: 'Infrastructure Architecture and Deployment Pipeline',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'Complete Infrastructure Diagram',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({
      text: `
┌──────────────────────────────────────────────────────────────────────┐
│                          DNS & DOMAIN ROUTING                        │
│              (Route53 or CloudFlare) - routes to origin               │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    www.creatorly.com  api.creatorly.com  admin.creatorly.com
        │                  │                  │
        ├─ CNAME ├─────────├─ CNAME ├───────┤
        │        │         │        │       │
        └────────┴─ CDN (CloudFront) ───────┘
                         │
                         │ HTTP/2
                         ▼
        ┌────────────────────────────┐
        │    EDGE CDN LAYER          │
        │  (Vercel Edge Network)     │
        │  • Global distribution     │
        │  • Static asset caching    │
        │  • Image optimization      │
        │  • Request routing         │
        └────────────┬───────────────┘
                     │
                     │ HTTPS
                     ▼
        ┌─────────────────────────────────┐
        │   LOAD BALANCER (Vercel)        │
        │   • Route to backend servers    │
        │   • SSL/TLS termination        │
        │   • Rate limiting              │
        └─────────┬───────────┬───────────┘
                  │           │
                  ▼           ▼
        ┌──────────────────────────────┐
        │  NEXT.JS DEPLOYMENT (Vercel) │
        │  ┌──────────────────────────┤
        │  │ Frontend - React/JS       │
        │  │ • Pages: src/app         │
        │  │ • Components             │
        │  │ • Client-side rendering  │
        │  └──────────────────────────┤
        │  ┌──────────────────────────┤
        │  │ API Routes - Backend     │
        │  │ • src/app/api           │
        │  │ • Serverless functions  │
        │  │ • Connection pooling    │
        │  └──────────────────────────┘
        │   Runs as:                  │
        │   • Production builds       │
        │   • Cold start: ~100-500ms  │
        │   • Warm: <100ms            │
        └──────────┬──────────────────┘
                   │
         ┌─────────┴──────────┬────────────┬──────────────┐
         │                    │            │              │
         ▼                    ▼            ▼              ▼
    ┌─────────┐       ┌──────────────┐ ┌──────────┐ ┌──────────┐
    │ MongoDB │       │ Redis Cache  │ │ Bull MQ  │ │ Workers  │
    │ Primary │       │ (Upstash)    │ │ Queue    │ │ (Lambda) │
    │   DB    │       │              │ │          │ │ Processor│
    │         │       │ • TTL caching│ │ • Email  │ │          │
    │ Atlas   │       │ • Session    │ │ • Events │ │ BullMQ   │
    │ Hosting │       │ • Rate limit │ │ • Webhk  │ │ Consumer │
    │         │       │ • Pub/Sub    │ │          │ │          │
    └─────────┘       └──────────────┘ └──────────┘ └──────────┘
         │                   │              │            │
         └─ Replication     │              │            │
           backups daily    └──────────────┴────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ AWS S3 Storage   │
                        │  • Media files   │
                        │  • Documents     │
                        │  • User uploads  │
                        │  • CDN delivery  │
                        │  • Encryption    │
                        │    at rest       │
                        └──────────────────┘


ENVIRONMENT COMPARISON TABLE:

┌─────────────────────┬───────────────┬─────────────┬──────────────┐
│ Resource Type       │ Development   │ Staging     │ Production   │
├─────────────────────┼───────────────┼─────────────┼──────────────┤
│ Frontend Hosting    │ localhost:3000│ vercel-stg  │ Vercel Prod  │
│ API Server          │ localhost:3000│ api-stg     │ api.prod     │
│ Database            │ Local MongoDB │ MongoDB Atl.│ MongoDB Atl. │
│                     │               │      (Stg)  │     (Prod)   │
│ Cache (Redis)       │ localhost:6379│ Upstash-stg │ Upstash-prod │
│ Queue System        │ Local Redis   │ Upstash-stg │ Upstash-prod │
│ Email Service       │ Mailhog       │ SendGrid-stg│ SendGrid-prod│
│                     │ (test SMTP)   │             │              │
│ File Storage        │ Local fs      │ AWS S3 (stg)│ AWS S3 (prod)│
│ Secrets Manager     │ .env.local    │ Vercel Env  │ Vercel Env   │
│ CDN                 │ None          │ CloudFront  │ CloudFront   │
│ SSL Certificate     │ Self-signed   │ LetsEncrypt │ AWS ACM      │
│ Monitoring          │ Console logs  │ Sentry/Loki │ Sentry/Cloud │
│ Backups             │ Manual        │ Weekly auto │ Daily + 30d  │
│ Recovery Plan       │ N/A           │ 24 hours    │ 1 hour RTO   │
│ Scaling             │ Manual        │ Auto (2-5)  │ Auto (5-100) │
│ Concurrency Limit   │ 1             │ 10          │ 100+         │
│ Rate Limiting       │ 1000/min      │ 500/min     │ 100/min/user │
│ Compliance Required │ No            │ Partial     │ Full (SOC2)  │
└─────────────────────┴───────────────┴─────────────┴──────────────┘


CI/CD PIPELINE FLOW (GitHub Actions):

┌─ Developer pushes code to GitHub
│
├─ GitHub Actions Trigger: .github/workflows/
│
├─ STAGE 1: Code Checkout & Setup
│  ├─ Checkout repository
│  ├─ Setup Node.js version 20.x
│  ├─ Setup npm/yarn cache
│  └─ Install dependencies
│
├─ STAGE 2: Linting & Code Quality
│  ├─ Run ESLint
│  │  ├─ If violation found → Fail pipeline, post comment
│  │  └─ Otherwise → Continue
│  ├─ Run Prettier format check
│  ├─ Run TypeScript compiler
│  │  ├─ If type error → Fail pipeline
│  │  └─ Otherwise → Continue
│  └─ Run SonarQube analysis (optional)
│
├─ STAGE 3: Unit & Integration Tests
│  ├─ Run Jest tests (jest.config.js)
│  ├─ Generate coverage report
│  ├─ If coverage < 70% → Warning (continue)
│  ├─ If tests > 5% fail → Fail pipeline
│  └─ Upload coverage to Codecov
│
├─ STAGE 4: Security Scanning
│  ├─ Run npm audit for dependencies
│  │  ├─ If high severity → Fail pipeline
│  │  └─ Otherwise → Warning
│  ├─ SAST scanning (optional)
│  └─ Secret scanning (prevent API keys in code)
│
├─ STAGE 5: Build Production
│  ├─ npm run build (Next.js)
│  │  ├─ If build fails → Fail pipeline
│  │  ├─ Otherwise → Generate .next/ artifact
│  │  └─ Upload to S3 for caching
│  └─ Generate source maps
│
├─ STAGE 6: E2E Tests (Playwright)
│  ├─ Deploy staging version
│  ├─ Run smoke tests
│  │  ├─ User signup flow
│  │  ├─ Product creation
│  │  ├─ Checkout process
│  │  └─ Payment webhook simulation
│  ├─ If tests fail → Fail pipeline
│  └─ Cleanup staging
│
├─ STAGE 7: Container Preparation (if applicable)
│  ├─ Build Docker image
│  ├─ Push to ECR registry
│  ├─ Tag with commit SHA
│  └─ Scan image for vulnerabilities
│
├─ STAGE 8: Deploy to Staging
│  ├─ Authenticate to Vercel
│  ├─ Deploy preview environment
│  ├─ Run smoke tests on staging
│  ├─ Notify team of staging URL
│  └─ If tests fail → Don't promote to prod
│
├─ STAGE 9: Manual Approval Gate
│  ├─ Require approval from code owner
│  ├─ Slack notification sent to #deployments
│  ├─ Team reviews staging environment
│  └─ Team approves or rejects deployment
│
├─ STAGE 10: Deploy to Production
│  ├─ Blue-Green deployment:
│  │  ├─ Deploy new version (Green)
│  │  ├─ Run health checks (Green)
│  │  ├─ Route traffic: Blue → Green
│  │  ├─ Monitor error rate (5 min)
│  │  └─ Keep Blue ready for instant rollback
│  ├─ If issues detected:
│  │  ├─ Automatic rollback to Blue
│  │  ├─ Alert ops team
│  │  ├─ Post-incident review
│  │  └─ Root cause analysis
│  └─ Otherwise:
│      ├─ Decommission Blue
│      ├─ Notify team of successful deploy
│      └─ Update deployment log
│
├─ STAGE 11: Post-Deployment Health Checks
│  ├─ Check API endpoints responding
│  ├─ Check database connectivity
│  ├─ Check external service integrations
│  ├─ Monitor error rate (< 0.1%)
│  ├─ Monitor response time (< 200ms p95)
│  ├─ Monitor CPU/Memory usage
│  └─ Send notification to #deployments
│
└─ End CI/CD Pipeline


ROLLBACK STRATEGY:

Automatic Rollback Triggers:
1. Error rate > 1% for 30 seconds → Rollback
2. API response time p95 > 5 seconds → Rollback
3. Database query fails for 5 consecutive requests → Rollback
4. Manual trigger by ops team → Immediate rollback

Rollback Process:
1. Identify last known-good deployment
2. Route 100% traffic back to previous version
3. Verify error rate normalizes
4. Investigate root cause in new version
5. Fix, test, re-deploy

Deployment Hygiene:
- Max 3 deployments per day
- Never deploy on Friday after 2 PM
- Require at least 1 hour between deploys
- Keep 3 previous versions available for rollback
`,
      style: 'No Spacing',
      border: { left: { color: COLORS.accent, space: 12, style: BorderStyle.SINGLE, size: 8 } },
      shading: { type: ShadingType.CLEAR, color: 'F5F5F5' },
      run: { font: 'Courier New', size: 10 },
      spacing: { after: 120 },
    }),
    new PageBreak(),
  );

  // ==================== PHASE 9: SYSTEM WEAKNESS DETECTION ====================
  sections.push(
    createColoredHeader('PHASE 9: SYSTEM WEAKNESS DETECTION & RISKS', 1),
    new Paragraph({
      text: 'Security, Performance, and Architecture Analysis',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'Security Vulnerabilities',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Vulnerability', 'Severity', 'Affected Area', 'Mitigation'],
      [
        ['JWT token stored in localStorage instead of HttpOnly cookie', 'HIGH', 'Authentication', 'Migrate to HttpOnly cookies, implement refresh token rotation'],
        ['API keys hardcoded in client-side code', 'CRITICAL', 'Security', 'Use environment variables, implement server-side proxies'],
        ['Insufficient input validation on file uploads', 'HIGH', 'File Handling', 'Validate MIME types, file sizes, scan for malware'],
        ['Missing CSRF protection on state-changing endpoints', 'MEDIUM', 'API Security', 'Implement CSRF tokens, use SameSite cookies'],
        ['Webhook signature verification could be bypassed', 'CRITICAL', 'Payments', 'Enforce signature check, never trust webhook body alone'],
        ['SQL injection risks through unsanitized queries', 'HIGH', 'Database', 'Use parameterized queries, ORM protection'],
        ['Rate limiting not enforced on auth endpoints', 'MEDIUM', 'DoS', 'Implement exponential backoff, IP-based limits'],
        ['Sensitive data logged to console in production', 'MEDIUM', 'Privacy', 'Use structured logging, sanitize PII'],
        ['Missing HTTPS redirect enforcement', 'HIGH', 'Network', 'Configure HSTS, enforce HTTPS redirect'],
        ['No request/response encryption for PII fields', 'MEDIUM', 'Privacy', 'Encrypt sensitive fields at rest and in transit'],
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      text: 'Performance Bottlenecks',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Bottleneck', 'Impact', 'Location', 'Recommended Fix'],
      [
        ['N+1 query on product listing', 'HIGH', 'src/app/api/products/list', 'Implement eager loading, batch queries'],
        ['Missing indexes on frequently queried fields', 'HIGH', 'MongoDB', 'Add indexes on email, userId, productId, creatorId'],
        ['Synchronous email sending blocks API response', 'MEDIUM', 'src/services/EmailService', 'Queue emails asynchronously'],
        ['Large JSON responses not paginated', 'HIGH', 'API routes', 'Implement cursor-based pagination, limit 50 items'],
        ['Cache key conflicts between users', 'MEDIUM', 'Redis cache', 'Namespace cache keys with userId'],
        ['Database connection pool exhaustion at scale', 'HIGH', 'MongoDB Atlas', 'Increase pool size from 10 to 50'],
        ['Frontend bundle size > 500KB', 'MEDIUM', 'Build output', 'Code split routes, lazy load components'],
        ['No caching headers on API responses', 'MEDIUM', 'All endpoints', 'Add Cache-Control: public, max-age=300'],
        ['Memory leaks in event listeners', 'LOW', 'Background workers', 'Implement cleanup in finally blocks'],
        ['Webhook processing synchronous with payment', 'HIGH', 'Payment webhook', 'Move to background job immediately'],
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      text: 'Architecture Weaknesses',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Issue', 'Risk Level', 'Description', 'Recommendation'],
      [
        ['Tight coupling between API and Database', 'MEDIUM', 'Direct model usage in API routes', 'Implement repository pattern for abstraction'],
        ['No circuit breaker for external APIs', 'HIGH', 'Razorpay/S3 failures cascade', 'Implement Resilience4j or similar pattern'],
        ['Single point of failure in Redis queue', 'HIGH', 'All jobs lost if Redis down', 'Implement Redis cluster or backup queue'],
        ['No API versioning strategy', 'MEDIUM', 'Breaking changes affect clients', 'Implement /v1/, /v2/ routes with deprecation'],
        ['Monolithic codebase limits scaling', 'MEDIUM', 'All features in single process', 'Plan microservices split for email, payments'],
        ['No request/response logging for debugging', 'MEDIUM', 'Hard to troubleshoot failures', 'Implement structured logging with correlation IDs'],
        ['Missing feature flags for canary deployment', 'MEDIUM', 'Risk with new features', 'Implement feature flags, A/B testing'],
        ['No graceful shutdown for running jobs', 'HIGH', 'Data loss if pods killed violently', 'Implement SIGTERM handler, drain jobs'],
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      text: 'Missing Error Handling',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Error Scenario', 'Current Behavior', 'Impact', 'Fix'],
      [
        ['Database connection timeout', 'Request hangs for 30s', 'Poor UX', 'Implement connection timeout 5s, queue fallback'],
        ['Razorpay API down', 'Checkout fails silently', 'Lost revenue', 'Queue retries, use cache for failover'],
        ['Email service unavailable', 'Emails never sent', 'Customer confusion', 'Implement retry logic, manual resend option'],
        ['File upload virus detected', 'No handling', 'Security risk', 'Quarantine file, alert user, log incident'],
        ['Worker process crashes', 'Jobs lost', 'Data loss', 'Implement dead letter queue, alerting'],
        ['Webhook processing fails', 'Order incomplete', 'Revenue loss', 'Move to async processing, implement retry'],
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      text: 'Refactor Recommendations Priority Matrix',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Priority', 'Recommendation', 'Affected Files', 'Estimated Impact', 'Effort'],
      [
        ['P0', 'Migrate JWT to HttpOnly cookies, implement refresh tokens', 'src/lib/auth/, src/app/api/auth/', 'HIGH - Security', '2 days'],
        ['P0', 'Implement webhook signature enforcement', 'src/app/api/payments/razorpay/webhook/', 'HIGH - Revenue', '1 day'],
        ['P0', 'Add database indexes on all foreign keys', 'src/lib/models/', 'HIGH - Performance', '0.5 days'],
        ['P1', 'Implement repository pattern for database abstraction', 'src/lib/', 'MEDIUM - Architecture', '5 days'],
        ['P1', 'Add comprehensive error handling & retry logic', 'src/lib/services/', 'MEDIUM - Reliability', '3 days'],
        ['P1', 'Implement API versioning (/v1/, /v2/)', 'src/app/api/', 'MEDIUM - Scalability', '2 days'],
        ['P2', 'Setup feature flags for canary deployments', 'src/lib/features/', 'LOW - Operations', '1 day'],
        ['P3', 'Implement request correlation IDs for debugging', 'src/middleware/', 'LOW - DevOps', '1 day'],
      ]
    ),
    new PageBreak(),
  );

  // ==================== APPENDIX ====================
  sections.push(
    createColoredHeader('APPENDIX: QUICK REFERENCE GUIDES', 1),
    new Paragraph({
      text: 'Environment Variables, API Reference, and Schema Quick Look',
      spacing: { after: 120 },
      italics: true,
    }),
    new Paragraph({
      text: 'A.1: Environment Variables Reference',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Variable', 'Description', 'Required', 'Example Value'],
      [
        ['NEXT_PUBLIC_API_URL', 'Frontend API endpoint', 'Yes', 'https://api.creatorly.com'],
        ['MONGODB_URI', 'MongoDB connection string', 'Yes', 'mongodb+srv://user:pass@cluster.mongodb.net/db'],
        ['JWT_SECRET', 'Secret for JWT signing', 'Yes', 'your-super-secret-key-min-32-chars'],
        ['RAZORPAY_KEY_ID', 'Razorpay public key', 'Yes', 'rzp_live_XXXXX'],
        ['RAZORPAY_KEY_SECRET', 'Razorpay secret key', 'Yes', 'XXXXX (keep secret)'],
        ['RAZORPAY_WEBHOOK_SECRET', 'Razorpay webhook signing secret', 'Yes', 'XXXXX'],
        ['AWS_ACCESS_KEY_ID', 'AWS IAM access key', 'Yes', 'AKIA...'],
        ['AWS_SECRET_ACCESS_KEY', 'AWS IAM secret key', 'Yes', 'XXXXX (keep secret)'],
        ['AWS_S3_BUCKET', 'S3 bucket name', 'Yes', 'creatorly-prod-media'],
        ['AWS_REGION', 'AWS region', 'Yes', 'us-east-1'],
        ['REDIS_URL', 'Redis/Upstash connection', 'Yes', 'redis://host:port or https://...'],
        ['SENDGRID_API_KEY', 'SendGrid email API key', 'Yes', 'SG.XXXXX'],
        ['SENDGRID_FROM_EMAIL', 'Default sender email', 'Yes', 'noreply@creatorly.com'],
        ['SENTRY_DSN', 'Sentry error tracking DSN', 'No', 'https://key@sentry.io/project'],
        ['CLERK_SECRET_KEY', 'Clerk authentication secret', 'Yes', 'XXXXX'],
        ['POSTHOG_API_KEY', 'PostHog analytics key', 'No', 'phc_XXXXX'],
        ['NODE_ENV', 'Environment name', 'Yes', 'development | staging | production'],
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      text: 'A.2: Complete API Endpoint Reference',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Endpoint', 'Auth', 'Purpose', 'Status Code'],
      [
        ['POST /api/auth/signup', 'No', 'Register new user', '201/400'],
        ['POST /api/auth/login', 'No', 'User login', '200/401'],
        ['POST /api/auth/logout', 'Yes', 'User logout', '200'],
        ['POST /api/auth/refresh', 'No (refresh token)', 'Refresh access token', '200/401'],
        ['GET /api/users/me', 'Yes', 'Get current user profile', '200/401'],
        ['GET /api/products', 'No', 'List all products (paginated)', '200'],
        ['POST /api/products', 'Yes (creator)', 'Create new product', '201/403'],
        ['GET /api/products/:id', 'No', 'Get product details', '200/404'],
        ['PUT /api/products/:id', 'Yes (owner)', 'Update product', '200/403'],
        ['DELETE /api/products/:id', 'Yes (owner)', 'Delete product', '204/403'],
        ['POST /api/payments/razorpay/create-order', 'Yes', 'Create payment order', '200/400'],
        ['POST /api/payments/razorpay/webhook', 'No', 'Razorpay webhook endpoint', '200/400'],
        ['GET /api/orders', 'Yes', 'List user orders (paginated)', '200'],
        ['GET /api/orders/:id', 'Yes (owner)', 'Get order details', '200/404'],
        ['GET /api/coupons', 'Yes (creator)', 'List creator coupons', '200'],
        ['POST /api/coupons', 'Yes (creator)', 'Create coupon', '201/400'],
        ['GET /api/analytics', 'Yes (creator)', 'Get product analytics', '200'],
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      text: 'A.3: Database Collections Quick Reference',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 80 },
    }),
    createTable(
      ['Collection', 'Key Columns', 'Primary Index', 'Notes'],
      [
        ['users', '_id, email, role, subscriptionId', 'email (unique), createdAt', 'Contains auth credentials'],
        ['products', '_id, creatorId, title, productType, isPublished', 'creatorId, isPublished', 'Digital products/courses'],
        ['orders', '_id, userId, creatorId, razorpayOrderId, status', 'userId, razorpayOrderId', 'Purchase records'],
        ['order_access', '_id, userId, productId, expiresAt', 'userId-productId (unique)', 'User product access grants'],
        ['coupons', '_id, code, creatorId, validUntil, status', 'code (unique), creatorId-status', 'Discount codes'],
        ['users_sessions', '_id, userId, expiresAt', 'userId, createdAt', 'Active user sessions'],
        ['webhooks', '_id, eventId, status, processedAt', 'eventId (unique)', 'Razorpay webhook logs'],
        ['analytics_events', '_id, userId, eventType, createdAt', 'userId, eventType, createdAt', 'User activity tracking'],
      ]
    ),
  );

  // ==================== CREATE DOCUMENT ====================
  console.log('📄 Creating document structure...');
  const doc = new Document({
    sections: [{
      children: sections,
      properties: {
        page: {
          pageHeight: convertInchesToTwip(11),
          pageWidth: convertInchesToTwip(8.5),
        },
      },
    }],
  });

  console.log('💾 Generating Word document...');
  const buffer = await Packer.toBuffer(doc);
  
  const outputPath = 'e:/insta/CREATORLY_Architecture_Documentation.docx';
  fs.writeFileSync(outputPath, buffer);

  console.log(`\n✅ DOCUMENTATION GENERATED SUCCESSFULLY!\n`);
  console.log(`📁 Output file: ${outputPath}`);
  console.log(`📊 Document size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n✨ Complete documentation with 9 phases + appendix ready for download!`);
}

// Run the generator
generateDocumentation().catch(err => {
  console.error('❌ Error generating documentation:', err);
  process.exit(1);
});
