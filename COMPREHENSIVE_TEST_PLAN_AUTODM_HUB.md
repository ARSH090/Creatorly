# AutoDM Hub - Comprehensive Test Plan & Checklist
## Version 1.0 | Platform: Admin Dashboard & Creator Dashboard

---

## 📋 Document Overview

| Property | Value |
|----------|-------|
| **Project** | AutoDM Hub |
| **Scope** | Admin Dashboard & Creator Dashboard |
| **Tech Stack** | Next.js 15, TypeScript, MongoDB, Clerk Auth |
| **External Services** | WhatsApp, Google Sheets, OpenAI, AWS S3, Razorpay, BullMQ + Redis |
| **Test Types** | Functional, UI/UX, API, Integration, Security, Performance, Regression |

---

## 1. TEST ENVIRONMENT SETUP

### 1.1 Browser Testing Matrix

| Browser | Version | Viewport | OS |
|---------|---------|----------|-----|
| Chrome | Latest | 1920x1080, 1366x768 | Windows 11 |
| Firefox | Latest | 1920x1080 | Windows 11 |
| Safari | Latest | 1920x1080 | macOS |
| Edge | Latest | 1920x1080 | Windows 11 |
| Mobile Chrome | Latest | 390x844 (iPhone 12) | Android |
| Mobile Safari | Latest | 390x844 (iPhone 12) | iOS |
| Tablet iPad | Latest | 768x1024 | iPadOS |

### 1.2 Network Conditions

| Condition | Latency | Bandwidth | Packet Loss |
|-----------|---------|-----------|-------------|
| 4G/5G | 50ms | 20 Mbps | 0% |
| 3G | 200ms | 1.5 Mbps | 1% |
| Slow 3G | 400ms | 400 Kbps | 2% |
| Offline | N/A | 0 | 100% |

### 1.3 Testing Tools

| Tool | Purpose | Configuration |
|------|---------|----------------|
| **Chrome DevTools** | Network monitoring, console, performance | Lighthouse audit enabled |
| **Postman/Newman** | API testing | Environment: Development/Staging |
| **Playwright** | E2E automation | Config: playwright.config.ts |
| **JMeter/k6** | Load testing | Scripts in load-tests/ |
| **Burp Suite/ZAP** | Security scanning | OWASP Top 10 rules |
| **BrowserStack** | Cross-browser testing | Account required |

### 1.4 Test Accounts Required

| Role | Email Pattern | Purpose |
|------|---------------|---------|
| Admin | `admin@autodm.test` | Full system access |
| Creator | `creator*@autodm.test` | Multiple test creators |
| Free Tier Creator | `free*@autodm.test` | Tier restriction testing |
| Premium Creator | `premium*@autodm.test` | Paid features testing |
| Banned User | `banned@autodm.test` | Blocked account testing |

### 1.5 Environment Variables Required

```
bash
# Required for Testing
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=
REDIS_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
OPENAI_API_KEY=
WHATSAPP_TOKEN=
GOOGLE_SHEETS_CLIENT_ID=
```

---

## 2. FUNCTIONAL TESTING

### 2.1 CREATOR DASHBOARD - Test Cases

#### 2.1.1 Profile Management

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| CD-PROF-001 | Profile View | Display user profile information | Navigate to /dashboard/profile | All profile fields displayed correctly | | |
| CD-PROF-002 | Edit Name | Update display name | 1. Go to Profile<br>2. Click Edit<br>3. Change name<br>4. Save | Name updated, persists after refresh | | |
| CD-PROF-003 | Edit Bio | Update bio description | 1. Go to Profile<br>2. Edit bio field<br>3. Save | Bio updated with character count | | |
| CD-PROF-004 | Upload Avatar | Profile image upload | 1. Click upload button<br>2. Select image<br>3. Crop if needed<br>4. Save | Image uploads to S3, displays correctly | | |
| CD-PROF-005 | Invalid Avatar | Upload invalid file type | 1. Try uploading .txt file | Error message shown | | |
| CD-PROF-006 | Large Avatar | Upload file >10MB | 1. Upload large image | Size validation error shown | | |
| CD-PROF-007 | Public Profile Preview | Preview public page | 1. Click Preview button | Public profile renders correctly | | |
| CD-PROF-008 | Username Availability | Check username availability | 1. Enter username<br>2. Wait for check | Availability indicator shown | | |

#### 2.1.2 Storefront Builder

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| CD-STORE-001 | Add Service Button | Create new service | 1. Go to Storefront<br>2. Click Add Service<br>3. Fill form<br>4. Save | New button appears in builder | | |
| CD-STORE-002 | Remove Service | Delete service button | 1. Click delete on service<br>2. Confirm | Service removed from list | | |
| CD-STORE-003 | Reorder Services | Drag and drop reorder | 1. Drag service to new position | Order persists after save | | |
| CD-STORE-004 | Edit Service Label | Change button text | 1. Edit service label<br>2. Save | Label updated | | |
| CD-STORE-005 | Change Icon | Select different icon | 1. Open icon picker<br>2. Select icon | Icon displays correctly | | |
| CD-STORE-006 | Toggle Visibility | Hide/show service | 1. Toggle visibility switch | Service hidden on public page | | |
| CD-STORE-007 | Live Preview | Real-time preview | 1. Make changes<br>2. View preview | Changes reflect in real-time | | |
| CD-STORE-008 | Publish Changes | Push to production | 1. Click Publish<br>2. Confirm | Changes appear on public page | | |
| CD-STORE-009 | Duplicate Service | Clone existing service | 1. Click duplicate button | Copy created with "(Copy)" suffix | | |

#### 2.1.3 Leads Management

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| CD-LEAD-001 | Leads Table Display | View all leads | Navigate to /dashboard/leads | Table shows leads with correct columns | | |
| CD-LEAD-002 | Search Leads | Search by name/email | 1. Enter search term<br>2. Submit | Filtered results displayed | | |
| CD-LEAD-003 | Filter by Service | Filter leads by service | 1. Select service filter<br>2. Apply | Only matching leads shown | | |
| CD-LEAD-004 | Filter by Date | Filter by date range | 1. Select date range<br>2. Apply | Leads within range shown | | |
| CD-LEAD-005 | Sort Column | Sort table by column | 1. Click column header | Table sorts correctly | | |
| CD-LEAD-006 | Pagination | Navigate pages | 1. Click next page<br>2. Go to last page | Correct pagination, correct data per page | | |
| CD-LEAD-007 | Export CSV | Download leads as CSV | 1. Click Export<br>2. Save file | CSV downloads with all data | | |
| CD-LEAD-008 | Delete Lead | Remove single lead | 1. Click delete<br>2. Confirm | Lead removed from list and DB | | |
| CD-LEAD-009 | Lead Details | View lead information | 1. Click lead row | Details modal opens | | |
| CD-LEAD-010 | Bulk Select | Select multiple leads | 1. Check checkboxes<br>2. Select all | Bulk selection works | | |
| CD-LEAD-011 | Bulk Delete | Delete selected leads | 1. Select leads<br>2. Click delete<br>3. Confirm | All selected leads deleted | | |

#### 2.1.4 Referral Dashboard

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| CD-REF-001 | Referral Link Display | Show unique link | Navigate to /dashboard/referrals | Unique referral link shown | | |
| CD-REF-002 | Copy Link | Copy to clipboard | 1. Click copy button | Link copied, toast shown | | |
| CD-REF-003 | Clicks Counter | Track link clicks | 1. Open link in new browser<br>2. Return | Click count increments | | |
| CD-REF-004 | Conversions Counter | Track conversions | 1. New user signs up via link | Conversion count increments | | |
| CD-REF-005 | Progress Bar | Display reward progress | View progress bar | Shows correct percentage | | |
| CD-REF-006 | Share Button | Share on social | 1. Click share button | Opens share dialog | | |
| CD-REF-007 | Referral History | View past referrals | Navigate to history tab | List of referrals displayed | | |

#### 2.1.5 Analytics Page

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| CD-AN-001 | Charts Load | Display analytics charts | Navigate to /dashboard/analytics | Charts render with data | | |
| CD-AN-002 | Date Range Picker | Filter by date | 1. Select date range<br>2. Apply | Charts update with filtered data | | |
| CD-AN-003 | Tooltip Display | Show values on hover | 1. Hover over chart | Tooltip shows correct values | | |
| CD-AN-004 | Export Data | Download chart data | 1. Click export | Data exports correctly | | |
| CD-AN-005 | Real-time Updates | Live data display | Wait for refresh | Data updates automatically | | |
| CD-AN-006 | Empty State | No data scenario | Create new account | Empty state message shown | | |

#### 2.1.6 Settings Page

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| CD-SET-001 | WhatsApp Toggle | Enable/disable auto-send | 1. Toggle auto-send<br>2. Save | Preference saved | | |
| CD-SET-002 | Google Sheets Connect | Connect Google Sheets | 1. Click Connect<br>2. Authorize | Integration status shows connected | | |
| CD-SET-003 | Google Sheets Disconnect | Disconnect integration | 1. Click Disconnect<br>2. Confirm | Status shows disconnected | | |
| CD-SET-004 | Notification Preferences | Update notifications | 1. Change preferences<br>2. Save | Settings persist | | |
| CD-SET-005 | Password Change | Update password | 1. Enter current password<br>2. Enter new password<br>3. Confirm | Password updated successfully | | |
| CD-SET-006 | Two-Factor Authentication | Enable 2FA | 1. Navigate to security<br>2. Enable 2FA | 2FA setup flow completes | | |

#### 2.1.7 Orders & Products

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| CD-ORD-001 | Orders List | View all orders | Navigate to /dashboard/orders | Orders table displays | | |
| CD-ORD-002 | Order Details | View order info | 1. Click order | Details modal shows | | |
| CD-ORD-003 | Product Creation | Create new product | 1. Go to Products<br>2. Click Add<br>3. Fill form<br>4. Save | Product created | | |
| CD-ORD-004 | Product Edit | Modify product | 1. Edit product<br>2. Save | Changes persist | | |
| CD-ORD-005 | Product Delete | Remove product | 1. Delete product<br>2. Confirm | Product removed | | |
| CD-ORD-006 | Product Image Upload | Add product images | 1. Upload images | Images display in gallery | | |
| CD-ORD-007 | Pricing Update | Change product price | 1. Edit price<br>2. Save | Price updated | | |
| CD-ORD-008 | Inventory Management | Track stock | 1. Update quantity | Inventory reflects change | | |

#### 2.1.8 Affiliate & Commission

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| CD-AFF-001 | Affiliate Dashboard | View earnings | Navigate to /dashboard/affiliates | Earnings displayed | | |
| CD-AFF-002 | Commission History | View commissions | Navigate to commissions tab | List of commissions shown | | |
| CD-AFF-003 | Payout Request | Request withdrawal | 1. Request payout<br>2. Enter amount | Request submitted | | |
| CD-AFF-004 | Invite Affiliate | Invite new affiliate | 1. Click invite<br>2. Enter email | Invitation sent | | |

---

### 2.2 ADMIN DASHBOARD - Test Cases

#### 2.2.1 Overview/Dashboard

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-OVW-001 | Metrics Cards | Display key metrics | Navigate to /admin/dashboard | Cards show: Total Users, Leads Today, Revenue, etc. | | |
| AD-OVW-002 | Lead Trends Chart | Lead growth visualization | View chart | Chart renders with data | | |
| AD-OVW-003 | Service Distribution | Pie chart of services | View pie chart | Distribution shown correctly | | |
| AD-OVW-004 | Recent Activity | Activity feed | View activity section | Latest actions displayed | | |
| AD-OVW-005 | Live Metrics | Real-time updates | Monitor page | Metrics update in real-time | | |
| AD-OVW-006 | Date Range Filter | Filter dashboard data | 1. Select range<br>2. Apply | Data filters correctly | | |

#### 2.2.2 User Management

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-USR-001 | Users Table | List all users | Navigate to /admin/users | Users table with columns | | |
| AD-USR-002 | Search Users | Search by email/name | 1. Enter search term<br>2. Submit | Filtered results | | |
| AD-USR-003 | Filter by Role | Filter by role | 1. Select role filter | Only matching users | | |
| AD-USR-004 | Change User Role | Promote to admin | 1. Select user<br>2. Change role | Role updated | | |
| AD-USR-005 | Freeze Account | Suspend user | 1. Click freeze<br>2. Confirm | User cannot login | | |
| AD-USR-006 | Unfreeze Account | Reactivate user | 1. Click unfreeze | User can login again | | |
| AD-USR-007 | Delete User | Remove user | 1. Delete user<br>2. Confirm | User deleted, leads handled | | |
| AD-USR-008 | View User Details | User profile view | 1. Click user row | Details modal | | |
| AD-USR-009 | Bulk User Actions | Select multiple users | 1. Select users<br>2. Apply action | Bulk action works | | |
| AD-USR-010 | Export Users | Download user list | 1. Click Export | CSV downloads | | |

#### 2.2.3 Leads Management

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-LEAD-001 | All Leads View | View all platform leads | Navigate to /admin/leads | All leads displayed | | |
| AD-LEAD-002 | Lead Search | Search leads | 1. Enter search | Results filtered | | |
| AD-LEAD-003 | Filter by Creator | Filter by creator | 1. Select creator | Creator's leads shown | | |
| AD-LEAD-004 | Filter by Source | Filter by lead source | 1. Select source | Source filtered | | |
| AD-LEAD-005 | Bulk Delete | Delete multiple leads | 1. Select leads<br>2. Delete | Leads removed | | |
| AD-LEAD-006 | Export Leads | Download all leads | 1. Click Export | CSV with all fields | | |
| AD-LEAD-007 | Lead Details | View full details | 1. Click lead | Full info modal | | |
| AD-LEAD-008 | Assign Lead | Assign to creator | 1. Select lead<br>2. Assign | Lead assigned | | |

#### 2.2.4 Orders Management

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-ORD-001 | Orders List | View all orders | Navigate to /admin/orders | Orders table displays | | |
| AD-ORD-002 | Order Details | View order info | 1. Click order | Full details shown | | |
| AD-ORD-003 | Refund Order | Process refund | 1. Select order<br>2. Click refund<br>3. Confirm | Refund processed | | |
| AD-ORD-004 | Filter Orders | Filter by status | 1. Select status | Filtered results | | |
| AD-ORD-005 | Order Statistics | Revenue metrics | View stats | Correct totals | | |

#### 2.2.5 Products Management

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-PROD-001 | Products List | View all products | Navigate to /admin/products | All products shown | | |
| AD-PROD-002 | Edit Product | Modify any product | 1. Edit product<br>2. Save | Changes persist | | |
| AD-PROD-003 | Delete Product | Remove product | 1. Delete product<br>2. Confirm | Product removed | | |
| AD-PROD-004 | Feature Product | Mark as featured | 1. Click feature | Featured status toggled | | |
| AD-PROD-005 | Product Search | Find product | 1. Search | Results filtered | | |

#### 2.2.6 Coupons Management

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-CPN-001 | Coupons List | View all coupons | Navigate to /admin/coupons | Coupons displayed | | |
| AD-CPN-002 | Create Coupon | Generate new coupon | 1. Create coupon<br>2. Set details<br>3. Save | Coupon created | | |
| AD-CPN-003 | Edit Coupon | Modify coupon | 1. Edit coupon<br>2. Save | Changes persist | | |
| AD-CPN-004 | Delete Coupon | Remove coupon | 1. Delete coupon<br>2. Confirm | Coupon removed | | |
| AD-CPN-005 | Coupon Usage | Track usage | View usage count | Correct count | | |

#### 2.2.7 Finance & Payouts

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-FIN-001 | Finance Dashboard | View financial overview | Navigate to /admin/finance | Revenue, payouts shown | | |
| AD-FIN-002 | Payouts List | View payout requests | Navigate to /admin/payouts | Pending/completed shown | | |
| AD-FIN-003 | Approve Payout | Approve withdrawal | 1. Select payout<br>2. Approve | Status updated | | |
| AD-FIN-004 | Reject Payout | Deny payout | 1. Select payout<br>2. Reject | Status updated, reason sent | | |
| AD-FIN-005 | Freeze Payout | Block creator payout | 1. Click freeze | Creator blocked from payout | | |
| AD-FIN-006 | Revenue Reports | Generate reports | 1. Select date range<br>2. Generate | Report displays | | |

#### 2.2.8 Subscriptions Management

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-SUB-001 | Subscriptions List | View all subscriptions | Navigate to /admin/subscriptions | List displays | | |
| AD-SUB-002 | Cancel Subscription | Cancel user sub | 1. Select user<br>2. Cancel | Subscription cancelled | | |
| AD-SUB-003 | Plans Management | Manage subscription plans | Navigate to plans | CRUD operations work | | |
| AD-SUB-004 | Subscription Analytics | View sub statistics | View analytics | Charts render | | |

#### 2.2.9 Analytics

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-AN-001 | Platform Analytics | View platform metrics | Navigate to /admin/analytics | Charts display | | |
| AD-AN-002 | User Growth | Track user growth | View user chart | Growth data shown | | |
| AD-AN-003 | Revenue Analytics | Track revenue | View revenue chart | Correct totals | | |
| AD-AN-004 | Export Analytics | Download reports | 1. Click export | Data exports | | |

#### 2.2.10 Logs & Monitoring

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-LOG-001 | Audit Logs | View admin actions | Navigate to /admin/logs | Actions logged | | |
| AD-LOG-002 | Filter Logs | Filter by admin | 1. Select admin | Filtered logs | | |
| AD-LOG-003 | Filter by Date | Date range filter | 1. Select range | Correct filtering | | |
| AD-LOG-004 | Log Details | View action details | 1. Click log | Full details shown | | |
| AD-LOG-005 | Live Monitoring | Real-time system status | Navigate to /admin/live-monitoring | Live metrics display | | |

#### 2.2.11 Settings

| Test Case ID | Feature | Test Scenario | Steps to Execute | Expected Result | Status | Notes |
|--------------|---------|---------------|------------------|-----------------|--------|-------|
| AD-SET-001 | Global Settings | System configuration | Navigate to /admin/settings | Settings displayed | | |
| AD-SET-002 | Auto-send Toggle | Global WhatsApp toggle | 1. Toggle<br>2. Save | Global preference saved | | |
| AD-SET-003 | Google Sheets Sync | Manual sync trigger | 1. Click sync | Sync initiated | | |
| AD-SET-004 | Rate Limits | Configure rate limits | 1. Update limits<br>2. Save | New limits applied | | |

---

## 3. UI/UX TESTING

### 3.1 Visual Consistency

| Test Case ID | Element | Test Scenario | Steps | Expected Result |
|--------------|---------|---------------|-------|-----------------|
| UI-VIS-001 | Color Scheme | Verify consistent colors | Compare across pages | Primary blue #3B82F6 used consistently |
| UI-VIS-002 | Typography | Font consistency | Check all pages | Same font family/sizes |
| UI-VIS-003 | Spacing | Consistent margins/padding | Inspect elements | 16px/24px standard |
| UI-VIS-004 | Button Styles | Consistent buttons | Check all buttons | Same styles across app |
| UI-VIS-005 | Form Styles | Input field consistency | Check all forms | Same input styles |
| UI-VIS-006 | Icons | Icon consistency | Check icons | Lucide icons used uniformly |

### 3.2 Responsiveness

| Test Case ID | Viewport | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| UI-RESP-001 | Desktop 1920px | Full dashboard view | Navigate to dashboard | All elements visible |
| UI-RESP-002 | Laptop 1366px | Standard laptop view | Navigate to dashboard | No horizontal scroll |
| UI-RESP-003 | Tablet 768px | iPad view | Navigate to dashboard | Sidebar collapsible |
| UI-RESP-004 | Mobile 390px | Phone view | Navigate to dashboard | Mobile menu works |
| UI-RESP-005 | Table Scroll | Mobile table view | View table on mobile | Horizontal scroll works |
| UI-RESP-006 | Modal Responsive | Modal on mobile | Open modal on mobile | Fits screen properly |

### 3.3 Loading States

| Test Case ID | Scenario | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| UI-LOAD-001 | Skeleton Loading | Page with data | Load dashboard | Skeleton shown before data |
| UI-LOAD-002 | Spinner | Button loading | Submit form | Spinner during submission |
| UI-LOAD-003 | Progress Bar | File upload | Upload image | Progress shown |
| UI-LOAD-004 | No Layout Shift | Content loading | Load page | No CLS |

### 3.4 Empty States

| Test Case ID | Scenario | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| UI-EMPTY-001 | No Leads | Empty leads page | Create new account | Helpful empty state shown |
| UI-EMPTY-002 | No Orders | Empty orders | New creator | Empty state displayed |
| UI-EMPTY-003 | No Products | Empty products | New creator | CTA to add product |

### 3.5 Error States

| Test Case ID | Scenario | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| UI-ERR-001 | Form Validation | Invalid input | Submit invalid form | Inline error messages |
| UI-ERR-002 | API Error | Failed request | Disconnect network | Error toast shown |
| UI-ERR-003 | 404 Page | Invalid route | Navigate to /invalid | Custom 404 page |
| UI-ERR-004 | 500 Page | Server error | Force error | Error page shown |

---

## 4. BACKEND & API TESTING

### 4.1 Authentication API

| Test Case ID | Endpoint | Method | Test Scenario | Steps ||--------------|----------|--------|---------------|-------|---------------- Expected Result |
-|
| API-AUTH-001 | /api/auth/login | POST | Valid login | Submit credentials | 200, JWT token |
| API-AUTH-002 | /api/auth/login | POST | Invalid password | Wrong password | 401, error message |
| API-AUTH-003 | /api/auth/login | POST | Rate limiting | 5 rapid attempts | 429, rate limit error |
| API-AUTH-004 | /api/auth/me | GET | Get current user | Send valid token | 200, user data |
| API-AUTH-005 | /api/auth/me | GET | No token | Request without token | 401, unauthorized |
| API-AUTH-006 | /api/auth/sync | POST | Sync user | Sync with Clerk | 200, synced |

### 4.2 Creator Dashboard API

| Test Case ID | Endpoint | Method | Test Scenario | Steps | Expected Result |
|--------------|----------|--------|---------------|-------|-----------------|
| API-CRE-001 | /api/creator/profile | GET | Get profile | Authenticated request | 200, profile data |
| API-CRE-002 | /api/creator/profile | PUT | Update profile | Update fields | 200, updated data |
| API-CRE-003 | /api/creator/products | GET | List products | Get all products | 200, product list |
| API-CRE-004 | /api/creator/products | POST | Create product | Create new | 201, product created |
| API-CRE-005 | /api/creator/products/[id] | PUT | Update product | Update product | 200, updated |
| API-CRE-006 | /api/creator/products/[id] | DELETE | Delete product | Delete product | 204, deleted |
| API-CRE-007 | /api/creator/analytics | GET | Get analytics | Request data | 200, analytics data |
| API-CRE-008 | /api/creator/orders | GET | List orders | Get orders | 200, order list |
| API-CRE-009 | /api/creator/payouts | POST | Request payout | Submit request | 200, request created |
| API-CRE-010 | /api/creator/upload | POST | Upload file | Send file | 200, file URL |

### 4.3 Leads API

| Test Case ID | Endpoint | Method | Test Scenario | Steps | Expected Result |
|--------------|----------|--------|---------------|-------|-----------------|
| API-LEAD-001 | /api/leads | GET | List leads | Get leads | 200, leads array |
| API-LEAD-002 | /api/leads | POST | Create lead | Submit lead form | 201, lead created |
| API-LEAD-003 | /api/leads/export | GET | Export leads | Request export | 200, CSV file |
| API-LEAD-004 | /api/leads | GET | Search leads | Search query | 200, filtered results |
| API-LEAD-005 | /api/leads | GET | Filter leads | Filter params | 200, filtered |

### 4.4 Admin API

| Test Case ID | Endpoint | Method | Test Scenario | Steps | Expected Result |
|--------------|----------|--------|---------------|-------|-----------------|
| API-ADMIN-001 | /api/admin/users | GET | List users | Admin request | 200, user list |
| API-ADMIN-002 | /api/admin/users/[id] | PUT | Update user | Modify user | 200, updated |
| API-ADMIN-003 | /api/admin/users/[id]/suspend | POST | Suspend user | Suspend | 200, suspended |
| API-ADMIN-004 | /api/admin/users/[id]/unsuspend | POST | Unsuspend user | Reactivate | 200, active |
| API-ADMIN-005 | /api/admin/leads | GET | List all leads | Get all leads | 200, lead list |
| API-ADMIN-006 | /api/admin/leads/bulk-delete | POST | Bulk delete | Delete IDs | 200, deleted |
| API-ADMIN-007 | /api/admin/dashboard | GET | Dashboard stats | Get stats | 200, metrics |
| API-ADMIN-008 | /api/admin/orders | GET | List orders | Get all orders | 200, orders |
| API-ADMIN-009 | /api/admin/orders/[id]/refund | POST | Refund order | Process refund | 200, refunded |
| API-ADMIN-010 | /api/admin/payouts | GET | List payouts | Get payouts | 200, payout list |
| API-ADMIN-011 | /api/admin/logs | GET | Audit logs | Get logs | 200, logs |
| API-ADMIN-012 | /api/admin/products/[id]/feature | POST | Feature product | Mark featured | 200, featured |

### 4.5 Payments API

| Test Case ID | Endpoint | Method | Test Scenario | Steps | Expected Result |
|--------------|----------|--------|---------------|-------|-----------------|
| API-PAY-001 | /api/payments/razorpay/create-order | POST | Create order | Submit order | 200, order created |
| API-PAY-002 | /api/payments/razorpay/webhook | POST | Payment webhook | Receive webhook | 200, processed |
| API-PAY-003 | /api/payments/refund | POST | Process refund | Submit refund | 200, refunded |
| API-PAY-004 | /api/payments/validate-coupon | POST | Validate coupon | Check code | 200, valid/invalid |

### 4.6 Referral & Affiliate API

| Test Case ID | Endpoint | Method | Test Scenario | Steps | Expected Result |
|--------------|----------|--------|---------------|-------|-----------------|
| API-REF-001 | /api/affiliates | GET | List affiliates | Get list | 200, affiliates |
| API-REF-002 | /api/affiliates | POST | Create affiliate | Create new | 201, created |
| API-REF-003 | /api/affiliate/links | GET | Get referral link | Get link | 200, link data |
| API-REF-004 | /api/referral/track | GET | Track referral | Visit with ref | Cookie set |
| API-REF-005 | /api/creator/affiliates/commissions | GET | Get commissions | Request data | 200, data |

### 4.7 Integration APIs

| Test Case ID | Endpoint | Method | Test Scenario | Steps | Expected Result |
|--------------|----------|--------|---------------|-------|-----------------|
| API-INT-001 | /api/integrations/google/auth | GET | Google OAuth | Start auth | 302, redirect |
| API-INT-002 | /api/integrations/google/callback | GET | Google callback | OAuth callback | 302, redirect |
| API-INT-003 | /api/ai/generate | POST | AI content | Send prompt | 200, generated |
| API-INT-004 | /api/automations/trigger | POST | Trigger automation | Trigger | 200, queued |

---

## 5. INTEGRATION TESTING

### 5.1 External Services

| Test Case ID | Service | Test Scenario | Steps | Expected Result |
|--------------|---------|---------------|-------|-----------------|
| INT-WA-001 | WhatsApp | Deep link generation | Click WhatsApp button | Opens WhatsApp with message |
| INT-WA-002 | WhatsApp | Auto-send enabled | New lead captured | Message sent automatically |
| INT-GS-001 | Google Sheets | Connect integration | Authorize Google | Connected status |
| INT-GS-002 | Google Sheets | Sync leads | New lead created | Row appears in sheet |
| INT-AI-001 | OpenAI | Generate content | Use AI feature | Content generated |
| INT-AI-002 | OpenAI | Stream response | Request with streaming | Chunks received |
| INT-S3-001 | AWS S3 | File upload | Upload image | File in S3, URL returned |
| INT-RZ-001 | Razorpay | Payment flow | Complete purchase | Payment successful |
| INT-RZ-002 | Razorpay | Webhook processing | Payment webhook | Order updated |
| INT-REDIS-001 | Redis/Queue | Background job | Trigger job | Job processed |

### 5.2 End-to-End Flows

| Test Case ID | Flow | Test Scenario | Steps | Expected Result |
|--------------|------|---------------|-------|-----------------|
| INT-E2E-001 | Lead Capture | Full lead flow | 1. Visitor submits form<br>2. Lead appears in creator list<br>3. Lead appears in admin list | Lead in both dashboards |
| INT-E2E-002 | Referral Signup | Referral flow | 1. Click referral link<br>2. Sign up<br>3. Verify conversion | Conversion tracked |
| INT-E2E-003 | Product Purchase | Purchase flow | 1. Select product<br>2. Pay via Razorpay<br>3. Order created | Order complete |
| INT-E2E-004 | Subscription | Subscription flow | 1. Subscribe to plan<br>2. Payment<br>3. Access granted | Subscription active |
| INT-E2E-005 | Profile Update | Profile changes | 1. Update profile<br>2. Verify public page | Changes reflected |

---

## 6. SECURITY TESTING

### 6.1 Authentication & Authorization

| Test Case ID | Category | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| SEC-AUTH-001 | Unauthorized Access | Access /admin as creator | Login as creator, navigate to /admin | 403 Forbidden |
| SEC-AUTH-002 | Route Protection | Access /dashboard without login | Navigate to /dashboard | Redirect to login |
| SEC-AUTH-003 | Token Expiry | Expired session | Wait for token expiry | Redirect to login |
| SEC-AUTH-004 | Role Escalation | Try to access admin API | Use creator token on admin API | 403 Forbidden |
| SEC-AUTH-005 | Session Hijacking | Use stolen token | Use invalid token | Request rejected |

### 6.2 Input Validation

| Test Case ID | Category | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| SEC-INP-001 | SQL Injection | Search with SQL | Enter `' OR 1=1--` | Sanitized, no error |
| SEC-INP-002 | XSS Attack | Bio with script | Enter `<script>alert(1)</script>` | Escaped on render |
| SEC-INP-003 | NoSQL Injection | Search with NoSQL | Enter `{"$ne": null}` | Handled safely |
| SEC-INP-004 | Command Injection | Upload filename | Use `../../etc/passwd` | Sanitized |

### 6.3 Data Protection

| Test Case ID | Category | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| SEC-DATA-001 | Sensitive Data | Check API response | Get user data | Passwords not returned |
| SEC-DATA-002 | IDOR - Leads | Access other creator's lead | Try to access via API | 403 Forbidden |
| SEC-DATA-003 | IDOR - Orders | View other user's order | Try to access | 403 Forbidden |
| SEC-DATA-004 | Bulk Data | Export all user data | Admin export | Only authorized data |

### 6.4 Security Headers

| Test Case ID | Category | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| SEC-HEAD-001 | CSP | Check headers | Inspect response | CSP header present |
| SEC-HEAD-002 | X-Frame-Options | Clickjacking test | Check header | DENY set |
| SEC-HEAD-003 | X-Content-Type | MIME sniffing | Check header | nosniff set |
| SEC-HEAD-004 | CORS | Cross-origin | Check CORS | Proper origin allowed |

### 6.5 Rate Limiting

| Test Case ID | Category | Test Scenario | Steps | Expected Result |
|--------------|----------|---------------|-------|-----------------|
| SEC-RATE-001 | Login Rate Limit | Rapid login attempts | 10 rapid attempts | 429 after limit |
| SEC-RATE-002 | API Rate Limit | Rapid API calls | 100+ rapid requests | Throttled |

---

## 7. PERFORMANCE TESTING

### 7.1 Page Load Performance

| Test Case ID | Metric | Test Scenario | Target | Status |
|--------------|--------|---------------|--------|--------|
| PERF-PAGE-001 | FCP | Dashboard load | < 1.8s | |
| PERF-PAGE-002 | LCP | Dashboard load | < 2.5s | |
| PERF-PAGE-003 | TTFB | API response | < 200ms | |
| PERF-PAGE-004 | CLS | Page load | < 0.1 | |

### 7.2 API Performance

| Test Case ID | Endpoint | Test Scenario | Target | Status |
|--------------|----------|---------------|--------|--------|
| PERF-API-001 | /api/creator/leads | List with 1000 records | < 500ms | |
| PERF-API-002 | /api/admin/users | List all users | < 1s | |
| PERF-API-003 | /api/creator/analytics | Load charts | < 2s | |

### 7.3 Stress Testing

| Test Case ID | Scenario | Test Scenario | Target | Status |
|--------------|----------|---------------|--------|--------|
| PERF-STR-001 | High Load | 100 concurrent users | System stable | |
| PERF-STR-002 | Database | Large dataset queries | No timeout | |
| PERF-STR-003 | Memory | Extended usage | No memory leak | |

### 7.4 Pagination Performance

| Test Case ID | Scenario | Test Scenario | Target | Status |
|--------------|----------|---------------|--------|--------|
| PERF-PAGE-001 | Large Dataset | 10,000 leads | Pagination works | |
| PERF-PAGE-002 | Search | Search with 10k records | Results < 1s | |

---

## 8. REGRESSION TESTING

### 8.1 Critical Path Regression

| Test Case ID | Feature | Previous Bug | Steps | Expected Result |
|--------------|---------|--------------|-------|-----------------|
| REG-001 | Login | Fixed login redirect | Login, verify redirect | Works correctly |
| REG-002 | Lead Export | Fixed CSV format | Export, verify columns | Correct format |
| REG-003 | Payment | Fixed webhook | Complete payment | Processed |
| REG-004 | Profile | Fixed image upload | Upload image | Displays |
| REG-005 | Admin Delete | Fixed cascade delete | Delete user | Leads handled |

---

## 9. BUG REPORT TEMPLATE

### 9.1 Bug Report Format

```
markdown
## Bug Report

### General Information
- **Bug ID**: BUG-[NUMBER]
- **Date Reported**: [YYYY-MM-DD]
- **Reporter**: [Name]
- **Priority**: [Critical/High/Medium/Low]
- **Status**: [Open/In Progress/Resolved/Closed]

### Environment
- **Browser**: [Browser + Version]
- **OS**: [Operating System]
- **Device**: [Desktop/Mobile/Tablet]
- **Screen Resolution**: [e.g., 1920x1080]
- **Network**: [WiFi/4G/LAN]

### Feature/Page
- **Module**: [Creator Dashboard/Admin Dashboard]
- **Page**: [URL or Page Name]
- **Component**: [Component Name if applicable]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
[What should happen]

### Actual Result
[What actually happened]

### Evidence
- **Screenshots**: [Attach screenshots]
- **Videos**: [Attach video if needed]
- **Console Logs**: 
```
[Copy console logs here]
```
- **Network Logs**:
```
[Copy network request/response]
```

### Root Cause Analysis
[Analysis of why the bug occurred]

### Suggested Fix
[How to fix the bug]

### Related Issues
- Related Bug ID: [If any]
- PR: [If any]
```

### 9.2 Severity Definitions

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | System down, data loss, security breach | Admin cannot access dashboard |
| **High** | Major feature broken, workaround difficult | Cannot export leads to CSV |
| **Medium** | Feature partially working | Pagination not working |
| **Low** | Cosmetic issue, minor annoyance | Typo in label |

---

## 10. TEST EXECUTION CHECKLIST

### Pre-Execution
- [ ] Test environment verified
- [ ] Test data prepared
- [ ] Test accounts created
- [ ] Tools configured
- [ ] Baseline performance captured

### During Execution
- [ ] Each test case executed
- [ ] Results documented
- [ ] Screenshots captured for failures
- [ ] Console logs captured
- [ ] Network logs captured

### Post-Execution
- [ ] All results compiled
- [ ] Bug reports filed
- [ ] Test coverage calculated
- [ ] Performance metrics analyzed
- [ ] Report generated

---

## 11. SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Product Manager | | | |
| Tech Lead | | | |
| Developer | | | |

---

## APPENDIX: Test Data Requirements

### Required Test Data

| Data Type | Quantity | Purpose |
|-----------|----------|---------|
| Users (Admin) | 3 | Testing admin functions |
| Users (Creators) | 20 | Testing creator dashboard |
| Users (Free tier) | 5 | Tier restrictions |
| Users (Premium) | 10 | Paid features |
| Leads | 1000+ | Pagination testing |
| Orders | 500+ | Order management |
| Products | 100+ | Product management |
| Coupons | 20 | Coupon testing |
| Referrals | 50 | Referral tracking |

### Test Scenarios for Data

1. **Leads**: Mix of sources (direct, referral, organic)
2. **Orders**: Mix of statuses (pending, paid, refunded, cancelled)
3. **Products**: Mix of types (digital, service, subscription)
4. **Users**: Mix of roles, subscription tiers, account ages

---

*Document Version: 1.0*
*Last Updated: Auto-generated*
*Next Review: [Date]*
