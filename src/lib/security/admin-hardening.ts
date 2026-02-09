/**
 * CREATORLY ADMIN HARDENING SYSTEM (SIMPLIFIED)
 * Enterprise-grade security for admin accounts  
 * Implements: 2FA, IP whitelisting, session security, emergency access
 */

import crypto from 'crypto';

// In-memory storage for admin security state
const adminLogs = new Map<string, any>();
const adminSessions = new Map<string, any>();

// ============================================================================
// ADMIN SECURITY CONFIGURATION
// ============================================================================

export const adminSecurityConfig = {
  // 2FA
  totp2FARequired: true,
  totpWindowSize: 1,
  backupCodesCount: 10,

  // Password
  passwordMinLength: 12,
  passwordRequireUppercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,

  // Login
  maxFailedAttempts: 3,
  lockoutDuration: 24 * 60 * 60 * 1000, // 24 hours
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxConcurrentSessions: 1,

  // IP Whitelisting
  ipWhitelistEnabled: true,
  requireDeviceTrust: true,

  // Business hours
  businessHoursOnly: '09:00-18:00',
  requireMFAOutsideBusinessHours: true,

  // Emergency access
  emergencyAccessTokenExpiry: 60 * 60 * 1000, // 1 hour

  // Alerts
  alertRequirementLevel: 'critical'
};

// ============================================================================
// 2FA & TOTP
// ============================================================================

export function generateTOTPSecret(): {
  secret: string;
  qrCode: string;
  backupCodes: string[];
} {
  const secret = crypto.randomBytes(20).toString('base64');
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  return {
    secret,
    qrCode: `otpauth://totp/Creatorly?secret=${secret}`,
    backupCodes
  };
}

export function verifyTOTPToken(secret: string, token: string): boolean {
  const speakeasy = require('speakeasy');
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: adminSecurityConfig.totpWindowSize || 1
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < adminSecurityConfig.passwordMinLength) {
    errors.push(`Password must be at least ${adminSecurityConfig.passwordMinLength} characters`);
  }

  if (adminSecurityConfig.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (adminSecurityConfig.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (adminSecurityConfig.passwordRequireSpecialChars && !/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// LOGIN ATTEMPT TRACKING & RATE LIMITING
// ============================================================================

export function trackLoginAttempt(
  adminId: string,
  ip: string,
  success: boolean
) {
  if (!success) {
    const admin = adminLogs.get(adminId) || {
      adminId,
      failedAttempts: 0,
      lockedUntil: null
    };

    admin.failedAttempts = (admin.failedAttempts || 0) + 1;

    if (admin.failedAttempts >= adminSecurityConfig.maxFailedAttempts) {
      admin.lockedUntil = new Date(Date.now() + adminSecurityConfig.lockoutDuration);
      logSecurityEvent(adminId, 'ACCOUNT_LOCKED', {
        failedAttempts: admin.failedAttempts,
        ip
      });
    }
    adminLogs.set(adminId, admin);
  } else {
    // Reset failed attempts on successful login
    const admin = adminLogs.get(adminId) || { adminId };
    admin.failedAttempts = 0;
    admin.lockedUntil = null;
    admin.lastLogin = new Date();
    admin.lastLoginIP = ip;
    adminLogs.set(adminId, admin);
  }
}

// ============================================================================
// ADMIN ACCOUNT LOCKING
// ============================================================================

export function isAdminLocked(adminId: string): boolean {
  const admin = adminLogs.get(adminId);

  if (!admin || !admin.lockedUntil) {
    return false;
  }

  if (new Date() > admin.lockedUntil) {
    // Unlock
    admin.lockedUntil = null;
    adminLogs.set(adminId, admin);
    return false;
  }

  return true;
}

// ============================================================================
// IP WHITELISTING
// ============================================================================

export function validateAdminIP(adminId: string, ip: string): boolean {
  if (!adminSecurityConfig.ipWhitelistEnabled) {
    return true;
  }

  const admin = adminLogs.get(adminId);

  if (!admin || !admin.trustedIPs) {
    return false; // Not whitelisted
  }

  return admin.trustedIPs.includes(ip);
}

export function whitelistAdminIP(
  adminId: string,
  ip: string
): boolean {
  const admin = adminLogs.get(adminId) || { adminId, trustedIPs: [] };

  if (!admin.trustedIPs) {
    admin.trustedIPs = [];
  }

  if (!admin.trustedIPs.includes(ip)) {
    admin.trustedIPs.push(ip);
  }

  adminLogs.set(adminId, admin);
  logSecurityEvent(adminId, 'IP_WHITELISTED', { ip });
  return true;
}

// ============================================================================
// SESSION SECURITY
// ============================================================================

export function generateSecureSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateAdminSession(adminId: string, token: string): boolean {
  const session = adminSessions.get(`${adminId}:${token}`);

  if (!session) {
    return false;
  }

  if (new Date() > session.expiresAt) {
    adminSessions.delete(`${adminId}:${token}`);
    return false;
  }

  // Update last activity
  session.lastActivity = new Date();
  return true;
}

export function revokeAllAdminSessions(adminId: string) {
  const keysToDelete: string[] = [];

  for (const key of adminSessions.keys()) {
    if (key.startsWith(adminId)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => adminSessions.delete(key));
  logSecurityEvent(adminId, 'ALL_SESSIONS_REVOKED', {});
}

// ============================================================================
// EMERGENCY ACCESS PROCEDURES
// ============================================================================

export function generateEmergencyAccessCode(adminId: string): string {
  const code = crypto.randomBytes(16).toString('hex');
  const admin = adminLogs.get(adminId) || { adminId };

  admin.emergencyAccessCode = code;
  admin.emergencyAccessCodeExpiry = new Date(
    Date.now() + adminSecurityConfig.emergencyAccessTokenExpiry
  );

  adminLogs.set(adminId, admin);
  logSecurityEvent(adminId, 'EMERGENCY_ACCESS_CODE_GENERATED', {});

  return code;
}

// ============================================================================
// ADMIN SECURITY AUDIT LOGGING
// ============================================================================

export function logSecurityEvent(
  adminId: string,
  eventType: string,
  details: Record<string, any> = {}
) {
  const log = {
    adminId,
    eventType,
    details,
    timestamp: new Date(),
    severity: getSeverity(eventType)
  };

  console.log(`[ADMIN SECURITY] ${eventType} - Admin: ${adminId}`, details);

  // Alert on critical events
  if (isCriticalEvent(eventType)) {
    alertSecurityTeam(adminId, eventType, details);
  }
}

function getSeverity(eventType: string): string {
  const criticalEvents = [
    'ACCOUNT_LOCKED',
    'FAILED_2FA',
    'UNAUTHORIZED_IP_ACCESS',
    'ADMIN_SUSPICIOUS_ACTIVITY',
    'EMERGENCY_ACCESS_USED'
  ];

  return criticalEvents.includes(eventType) ? 'critical' : 'normal';
}

function isCriticalEvent(eventType: string): boolean {
  const criticalEvents = [
    'ACCOUNT_LOCKED',
    'FAILED_2FA_ATTEMPTS',
    'UNAUTHORIZED_IP_ACCESS',
    'ADMIN_PASSWORD_RESET',
    'EMERGENCY_ACCESS_USED',
    'ADMIN_COMPROMISE_DETECTED'
  ];

  return criticalEvents.includes(eventType);
}

function alertSecurityTeam(
  adminId: string,
  eventType: string,
  details: Record<string, any>
) {
  const alertMessage = `
🚨 CRITICAL SECURITY EVENT
Admin: ${adminId}
Event: ${eventType}
Time: ${new Date().toISOString()}
Details: ${JSON.stringify(details)}
  `;

  console.warn(alertMessage);
  // TODO: Implement alerting (Slack webhook, Email, SMS)
}

// ============================================================================
// BUSINESS HOURS VALIDATION
// ============================================================================

export function isWithinBusinessHours(): boolean {
  const [start, end] = adminSecurityConfig.businessHoursOnly.split('-');
  const [startHour] = start.split(':');
  const [endHour] = end.split(':');

  const now = new Date();
  const currentHour = now.getHours();

  return currentHour >= parseInt(startHour) && currentHour < parseInt(endHour);
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

export function validateAdminAccess(
  adminId: string,
  ip: string,
  token?: string
): {
  valid: boolean;
  error?: string;
} {
  // Check if locked
  if (isAdminLocked(adminId)) {
    return { valid: false, error: 'Account temporarily locked due to failed login attempts' };
  }

  // Check IP whitelist
  if (!validateAdminIP(adminId, ip)) {
    return { valid: false, error: 'Access from non-whitelisted IP address' };
  }

  // Check business hours
  if (!isWithinBusinessHours()) {
    return { valid: false, error: 'Admin access only during business hours' };
  }

  // Validate session token if provided
  if (token && !validateAdminSession(adminId, token)) {
    return { valid: false, error: 'Invalid or expired session token' };
  }

  return { valid: true };
}

// ============================================================================
// EMERGENCY LOCKDOWN PROCEDURE
// ============================================================================

export function emergencyLockdown() {
  // Revoke all admin sessions
  adminSessions.clear();

  // Lock all accounts
  for (const [, admin] of adminLogs) {
    admin.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  console.log('🔴 EMERGENCY LOCKDOWN ACTIVATED - ' + new Date().toISOString());

  return { success: true, timestamp: new Date() };
}
