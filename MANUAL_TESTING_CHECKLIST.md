# Manual Testing Checklist for Creatorly

## Overview
This document provides step-by-step manual testing procedures for features that require browser interaction. Complete each test and mark the checkbox when done.

---

## 🔐 Authentication & Authorization

### Test 1.4: Login with Correct Credentials
**Prerequisites:** Use test account created by automated tests

**Steps:**
1. Open browser and navigate to `http://localhost:3000/auth/login`
2. Enter credentials:
   - Email: (check test output for generated email)
   - Password: `SecurePass123!`
3. Click "Login" or "Sign In" button
4. Observe the result

**Expected Results:**
- ✅ Successful login
- ✅ Redirect to `/dashboard` or home page
- ✅ User name/avatar displayed in header
- ✅ Session persists on page refresh

**Actual Results:**
- [ ] Test completed
- Result: _______________
- Issues: _______________

---

### Test 1.5: Login with Wrong Password (Rate Limiting)
**Steps:**
1. Navigate to `http://localhost:3000/auth/login`
2. Enter valid email but wrong password
3. Submit form 5 times in succession
4. Observe behavior after 3-5 attempts

**Expected Results:**
- ✅ Error message displayed for wrong password
- ✅ Rate limiting kicks in after 3-5 attempts
- ✅ Temporary lockout message shown
- ✅ Account not permanently locked

**Actual Results:**
- [ ] Test completed
- Rate limit threshold: _____ attempts
- Lockout duration: _____ minutes
- Issues: _______________

---

### Test 1.6: Protected Route Access
**Steps:**
1. Ensure you are logged OUT (clear cookies if needed)
2. Navigate directly to `http://localhost:3000/dashboard`
3. Observe behavior
4. Now login and try accessing `/dashboard` again

**Expected Results:**
- ✅ Unauthenticated: Redirect to `/auth/login`
- ✅ Authenticated: Access granted to dashboard
- ✅ Middleware properly configured

**Actual Results:**
- [ ] Test completed
- Redirect URL: _______________
- Issues: _______________

---

### Test 1.7: Token Expiry Simulation
**Steps:**
1. Login to application
2. Open browser DevTools → Application → Cookies
3. Note the `authToken` cookie and its expiry time
4. Either wait for expiry OR manually delete the cookie
5. Try to access `/dashboard` or any protected route

**Expected Results:**
- ✅ Expired/missing token redirects to login
- ✅ Graceful error handling
- ✅ No console errors

**Actual Results:**
- [ ] Test completed
- Token expiry time: _____ (from cookie)
- Behavior: _______________
- Issues: _______________

---

## 👤 User Profile & Settings

### Test 2.1: Update Display Name
**Steps:**
1. Login to application
2. Navigate to `/dashboard/settings` or `/dashboard/profile`
3. Find "Display Name" field
4. Change name to "Updated Test User"
5. Save changes
6. Refresh page and verify change persists

**Expected Results:**
- ✅ Name updated in database
- ✅ UI reflects change immediately
- ✅ Change persists after refresh
- ✅ Name displayed in header/profile

**Actual Results:**
- [ ] Test completed
- New name displayed: _______________
- Issues: _______________

---

### Test 2.2: Upload Avatar
**Steps:**
1. Navigate to profile settings
2. Find avatar upload section
3. Upload a valid image (JPG/PNG, < 5MB)
4. Wait for upload to complete
5. Verify avatar displayed

**Expected Results:**
- ✅ File upload works
- ✅ Progress indicator shown
- ✅ Avatar displayed after upload
- ✅ Image URL saved (check Network tab)

**Actual Results:**
- [ ] Test completed
- Upload service used: _____ (S3/Cloudinary)
- Avatar URL: _______________
- Issues: _______________

---

### Test 2.3: Invalid File Upload Detection
**Steps:**
1. Try uploading files:
   - Large file (> 10MB)
   - Invalid format (.txt, .exe)
   - Corrupted image

**Expected Results:**
- ✅ File size validation error
- ✅ File type validation error
- ✅ Clear error messages
- ✅ No server crashes

**Actual Results:**
- [ ] Large file test: _______________
- [ ] Invalid format test: _______________
- [ ] Corrupted file test: _______________
- Issues: _______________

---

### Test 2.4: Bio Character Limit
**Steps:**
1. Navigate to profile settings
2. Find bio/description field
3. Enter text exceeding limit (try 600 characters)
4. Attempt to save

**Expected Results:**
- ✅ Character counter displayed
- ✅ Limit enforced (frontend)
- ✅ Limit enforced (backend)
- ✅ Clear feedback to user

**Actual Results:**
- [ ] Test completed
- Character limit: _____ chars
- Frontend validation: _______________
- Backend validation: _______________
- Issues: _______________

---

### Test 2.5: Account Deletion & Data Anonymization
**Steps:**
1. Navigate to account settings
2. Find "Delete Account" option
3. Click delete
4. Confirm deletion
5. Try to login with deleted account

**Expected Results:**
- ✅ Confirmation dialog shown
- ✅ Account deleted/anonymized
- ✅ Session terminated
- ✅ Cannot login after deletion
- ✅ Data properly handled (GDPR)

**Actual Results:**
- [ ] Test completed
- Confirmation required: _______________
- Login attempt result: _______________
- Issues: _______________

---

## 📸 Instagram Integration

### Test 3.1.1: Connect Instagram (OAuth)
**Steps:**
1. Navigate to Instagram integration settings
2. Click "Connect Instagram"
3. Complete OAuth flow (login to Instagram)
4. Authorize application
5. Verify connection status

**Expected Results:**
- ✅ OAuth redirect works
- ✅ Instagram login page shown
- ✅ Authorization successful
- ✅ Connection status displayed
- ✅ Access token stored

**Actual Results:**
- [ ] Test completed
- OAuth flow: _______________
- Connection status: _______________
- Issues: _______________

---

### Test 3.1.2: Reconnect Expired Token
**Steps:**
1. Simulate expired token (or wait for expiry)
2. Try to perform Instagram action
3. Observe behavior

**Expected Results:**
- ✅ Expired token detected
- ✅ User prompted to reconnect
- ✅ Seamless re-authentication
- ✅ No data loss

**Actual Results:**
- [ ] Test completed
- Reconnect prompt: _______________
- Issues: _______________

---

### Test 3.1.3: Disconnect Instagram
**Steps:**
1. Navigate to Instagram settings
2. Click "Disconnect Instagram"
3. Confirm disconnection
4. Verify status

**Expected Results:**
- ✅ Confirmation dialog shown
- ✅ Access token removed
- ✅ Instagram features disabled
- ✅ Can reconnect later

**Actual Results:**
- [ ] Test completed
- Disconnect successful: _______________
- Issues: _______________

---

### Test 3.2.1: Create DM Template with Placeholders
**Steps:**
1. Navigate to DM automation settings
2. Create new template
3. Add placeholders: `{name}`, `{username}`
4. Save template

**Expected Results:**
- ✅ Template saved
- ✅ Placeholders validated
- ✅ Preview functionality works
- ✅ Character limit enforced

**Actual Results:**
- [ ] Test completed
- Template saved: _______________
- Preview works: _______________
- Issues: _______________

---

### Test 3.2.2: Trigger DM on Test Follower
**Steps:**
1. Select test follower
2. Choose DM template
3. Send DM
4. Verify delivery

**Expected Results:**
- ✅ DM sent successfully
- ✅ Placeholders replaced correctly
- ✅ Delivery confirmation shown

**Actual Results:**
- [ ] Test completed
- DM sent: _______________
- Placeholder replacement: _______________
- Issues: _______________

---

### Test 3.2.3: DM Rate Limit & Queue Handling
**Steps:**
1. Attempt to send multiple DMs rapidly
2. Observe queue behavior

**Expected Results:**
- ✅ Queue system handles requests
- ✅ Rate limits respected
- ✅ Status tracking visible

**Actual Results:**
- [ ] Test completed
- Queue behavior: _______________
- Rate limit: _____ DMs per _____
- Issues: _______________

---

### Test 3.2.4: Invalid Placeholder Fallback
**Steps:**
1. Create template with invalid placeholder: `{invalid_field}`
2. Send DM
3. Check result

**Expected Results:**
- ✅ Invalid placeholder detected
- ✅ Fallback value used
- ✅ Warning shown
- ✅ DM still sent

**Actual Results:**
- [ ] Test completed
- Fallback behavior: _______________
- Issues: _______________

---

### Test 3.3.1: Automatic Bio Sync
**Steps:**
1. Enable auto bio sync
2. Update bio in Creatorly
3. Wait for sync
4. Check Instagram bio

**Expected Results:**
- ✅ Sync triggered automatically
- ✅ Bio updated on Instagram
- ✅ Sync status displayed

**Actual Results:**
- [ ] Test completed
- Sync time: _______________
- Instagram bio updated: _______________
- Issues: _______________

---

### Test 3.3.2: Manual Bio Push
**Steps:**
1. Update bio in Creatorly
2. Click "Push to Instagram"
3. Verify update

**Expected Results:**
- ✅ Manual push works
- ✅ Confirmation shown
- ✅ Instagram bio updated

**Actual Results:**
- [ ] Test completed
- Push successful: _______________
- Issues: _______________

---

### Test 3.3.3: Conflict Resolution (Creatorly vs Instagram)
**Steps:**
1. Update bio on Instagram directly
2. Update bio in Creatorly (different text)
3. Observe conflict handling

**Expected Results:**
- ✅ Conflict detected
- ✅ User prompted to choose version
- ✅ No data loss
- ✅ Clear UI for resolution

**Actual Results:**
- [ ] Test completed
- Conflict detection: _______________
- Resolution UI: _______________
- Issues: _______________

---

## Summary

**Total Tests:** 23 manual tests
**Completed:** _____ / 23
**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Critical Issues Found:**
1. _______________
2. _______________
3. _______________

**Recommendations:**
1. _______________
2. _______________
3. _______________

**Tester:** _______________
**Date:** _______________
**Environment:** _______________
