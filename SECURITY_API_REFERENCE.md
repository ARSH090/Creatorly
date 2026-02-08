# 🛡️ SECURITY API REFERENCE

Quick reference for using Creatorly's security functions in your code.

---

## 🔐 Admin Security Functions

**File**: `src/lib/security/admin-hardening.ts`

### 2FA Functions

```typescript
// Generate TOTP secret for new user
const secret = generateTOTPSecret('user@example.com');
// Returns: { secret, backupCodes, qrCode }

// Verify 2FA token during login
const isValid = verifyTOTPToken(secret, userprovidedToken);
// Returns: boolean

// Lock/unlock admin account
await trackLoginAttempt(userId, success);
isLocked = await isAdminLocked(userId);
```

### Password & IP Functions

```typescript
// Validate password strength
const result = validatePasswordStrength(password);
// Returns: { score, feedback, isStrong }

// IP Whitelist management
await whitelistAdminIP(userId, ipAddress);
const canAccess = await validateAdminIP(userId, ipAddress);
```

### Usage Example

```typescript
// In /api/auth/login route:
import { verifyTOTPToken, trackLoginAttempt } from '@/lib/security/admin-hardening';

export async function POST(req: Request) {
  const { email, password, totpToken } = await req.json();
  
  // Verify 2FA
  if (!verifyTOTPToken(userSecret, totpToken)) {
    await trackLoginAttempt(userId, false);
    return new Response('Invalid 2FA token', { status: 401 });
  }
  
  await trackLoginAttempt(userId, true);
  // Continue with login...
}
```

---

## 🗄️ Database Security Functions

**File**: `src/lib/security/database-security.ts`

### Query Sanitization

```typescript
// Detect injection attacks in queries
const isSafe = validateQueryStructure(mongoQuery);

// Detect injection in values
const threat = detectInjectionAttack(userInput);

// Sanitize query recursively
const clean = sanitizeQuery(unsafeQuery);
```

### Field Encryption

```typescript
// Encrypt sensitive fields
const encrypted = await encryptField(sensitiveData, encryptionKey);

// Decrypt fields
const decrypted = await decryptField(encryptedData, encryptionKey);

// Mask sensitive data in logs
const masked = maskSensitiveFields(userData);
```

### Data Retention

```typescript
// Enforce retention policies
const result = await enforceRetentionPolicies();
// Returns: { deletedRecords, policyDetails }
```

### Usage Example

```typescript
// In /api/users route:
import { sanitizeQuery } from '@/lib/security/database-security';

export async function GET(req: Request) {
  const { userId } = req.query;
  
  // Sanitize before querying
  const safeQuery = sanitizeQuery({ _id: userId });
  
  // Safe to query
  const user = await User.findOne(safeQuery);
  // ...
}
```

---

## 💳 Payment Fraud Detection Functions

**File**: `src/lib/security/payment-fraud-detection.ts`

### Risk Scoring

```typescript
// Calculate fraud risk (0-100 scale)
const score = calculateFraudRiskScore({
  amount: 5000,           // ₹5000
  userId,
  ipAddress,
  card: { last4: '4242', country: 'IN' },
  previousTransactions: 15,
  daysSinceRegistration: 30
});

// Returns: 0-30 APPROVE, 30-60 OTP, 60-80 REVIEW, 80+ BLOCK
if (score > 60) {
  // Require additional verification
}
```

### 3D Secure Enforcement

```typescript
// Determine if 3DS is required
const require3DS = require3DSecure({
  amount: 25000,          // ₹25k threshold
  isNewCard: true,
  riskScore: 75
});

if (require3DS) {
  // Redirect to 3DS verification
}
```

### Webhook Verification

```typescript
// Verify Razorpay webhook signature
const isValid = verifyRazorpaySignature(
  webhookBody,
  webhookSignature,
  webhookSecret
);

if (!isValid) {
  // Reject webhook
  return new Response('Invalid signature', { status: 401 });
}
```

### Usage Example

```typescript
// In /api/payments/razorpay route:
import { 
  calculateFraudRiskScore, 
  require3DSecure,
  verifyRazorpaySignature 
} from '@/lib/security/payment-fraud-detection';

export async function POST(req: Request) {
  const { amount, userId, ipAddress, card } = await req.json();
  
  // Check fraud score
  const riskScore = calculateFraudRiskScore({
    amount,
    userId,
    ipAddress,
    card,
    previousTransactions: 5,
    daysSinceRegistration: 90
  });
  
  // Require 3DS if needed
  if (require3DSecure({ amount, isNewCard: card.isNew, riskScore })) {
    // Start 3DS flow
  }
  
  // Process payment...
}
```

---

## ⏱️ Rate Limiting Functions

**File**: `src/lib/security/api-security.ts`

### Check Rate Limits

```typescript
// Check if request is within rate limit
const result = checkRateLimit({
  type: 'login',           // 'public' | 'auth' | 'payment' | 'admin' | 'login'
  identifier: userId,      // User ID or IP
});

// Returns: { allowed: boolean, remaining: number, resetTime: Date }

if (!result.allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### Limits by Type

```typescript
// Default limits:
'public'   → 100 requests/hour
'auth'     → 1000 requests/hour
'payment'  → 50 requests/hour
'admin'    → 500 requests/hour
'login'    → 5 attempts/15 minutes
```

### Usage Example

```typescript
// In /api/auth/login route:
import { checkRateLimit } from '@/lib/security/api-security';

export async function POST(req: Request) {
  const { email } = await req.json();
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Check rate limit per email
  const limit = checkRateLimit({
    type: 'login',
    identifier: email
  });
  
  if (!limit.allowed) {
    return new Response('Too many login attempts', { status: 429 });
  }
  
  // Process login...
}
```

---

## 📊 Input Validation Functions

**File**: `src/lib/security/api-security.ts`

### Request Body Validation

```typescript
// Validate request body structure
const errors = validateRequestBody(body, schema);

if (errors.length > 0) {
  return new Response(JSON.stringify({ errors }), { status: 400 });
}
```

### Injection Detection

```typescript
// Detect common injection attacks
const threat = detectInjectionAttack(userInput);

if (threat.detected) {
  // Log and reject
  console.warn('Injection attempt:', threat.type);
  return new Response('Invalid input', { status: 400 });
}
```

### CSRF Token Management

```typescript
// Generate CSRF token for forms
const token = generateCSRFToken(sessionId);

// Validate CSRF token on submission
const isValid = validateCSRFToken(sessionId, providedToken);
```

### Usage Example

```typescript
// In any POST/PUT endpoint:
import { detectInjectionAttack, validateRequestBody } from '@/lib/security/api-security';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Detect injection attacks
  for (const [key, value] of Object.entries(body)) {
    if (detectInjectionAttack(String(value)).detected) {
      return new Response('Invalid input detected', { status: 400 });
    }
  }
  
  // Validate structure
  const errors = validateRequestBody(body, expectedSchema);
  if (errors.length > 0) {
    return new Response(JSON.stringify({ errors }), { status: 400 });
  }
  
  // Process request...
}
```

---

## 📡 Monitoring Functions

**File**: `src/lib/security/monitoring.ts`

### Event Logging

```typescript
// Log security event
await recordSecurityEvent({
  eventType: 'LOGIN_SUCCESS',     // See list below
  userId,
  ipAddress,
  userAgent,
  metadata: {
    loginMethod: '2fa',
    countryCode: 'IN'
  }
});
```

### Event Types

```
LOGIN_SUCCESS
LOGIN_FAILURE
LOGIN_SUSPICIOUS
LOGOUT
PASSWORD_CHANGED
2FA_ENABLED
2FA_DISABLED
ADMIN_ACTION
PAYMENT_INITIATED
PAYMENT_SUCCESS
PAYMENT_FRAUD_DETECTED
PAYMENT_CHARGEBACKED
REFUND_ISSUED
DATA_EXPORT_REQUESTED
DATA_DELETION_REQUESTED
SECURITY_ALERT
INCIDENT_CREATED
INCIDENT_RESOLVED
```

### Security Metrics

```typescript
// Get security metrics
const metrics = await getSecurityMetrics();
// Returns: {
//   totalEvents: number,
//   suspiciousActivities: number,
//   fraudAttempts: number,
//   incidentsOpen: number,
//   recentAlerts: Alert[]
// }
```

### Usage Example

```typescript
// In /api/auth/login route:
import { recordSecurityEvent } from '@/lib/security/monitoring';

export async function POST(req: Request) {
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  
  try {
    const user = await authenticateUser(email, password);
    
    // Log successful login
    await recordSecurityEvent({
      eventType: 'LOGIN_SUCCESS',
      userId: user.id,
      ipAddress: clientIP,
      userAgent,
      metadata: { via: 'email_password' }
    });
    
    // Return auth token...
  } catch (error) {
    // Log failed login
    await recordSecurityEvent({
      eventType: 'LOGIN_FAILURE',
      userId: email,
      ipAddress: clientIP,
      userAgent,
      metadata: { reason: error.message }
    });
    
    return new Response('Invalid credentials', { status: 401 });
  }
}
```

---

## ✅ Security Headers (Automatic)

These headers are automatically added to ALL responses:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' razorpay.com
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cache-Control: no-store, no-cache, must-revalidate
```

**Status**: ✅ Active everywhere (next.config.ts)

---

## 🧪 Testing Your Implementation

After integrating security functions, run tests:

```bash
# Run security tests
npm run security:test

# Check specific category
npm run security:audit

# Full verification
npm run security:scan
```

---

## 📋 Integration Checklist

- [ ] Rate limiting added to `/api/auth/login`
- [ ] Rate limiting added to `/api/payments/razorpay`
- [ ] Fraud detection added to payment webhook
- [ ] Injection detection added to all user input endpoints
- [ ] Security event logging added to critical paths
- [ ] 2FA functions ready for admin pages
- [ ] Database injection prevention on all queries
- [ ] Security tests passing (npm run security:test)

---

## 🚨 Emergency Functions

**Incident Response** (`src/lib/security/incident-response.ts`)

```typescript
// Emergency lockdown
await activateEmergencyLockdown();

// Backup database
const backup = await backupDatabase();

// Generate incident report
const report = await generateIncidentReport(incidentId);

// Notify authorities (CERT-In)
await notifyAuthorities({ incident, details });
```

---

**Last Updated**: February 8, 2026  
**API Version**: 1.0  
**Status**: ✅ Production Ready
