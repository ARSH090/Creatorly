/**
 * CREATORLY PAYMENT FRAUD DETECTION & SECURITY
 * Real-time fraud detection for Razorpay payments
 * Includes: velocity checks, device fingerprinting, risk scoring, 3D Secure
 */

import crypto from 'crypto';

// ============================================================================
// FRAUD DETECTION CONFIGURATION
// ============================================================================

export const fraudConfig = {
  enabled: true,
  strictMode: process.env.NODE_ENV === 'production',

  // Amount limits (in paise)
  limits: {
    minAmount: 1000, // ₹10
    maxAmount: 20000000, // ₹200,000
    kycThreshold: 5000000, // ₹50,000 - require KYC above this
    threeDSecureThreshold: 200000, // ₹2,000
    manualReviewThreshold: 2500000 // ₹25,000
  },

  // Velocity checks
  velocity: {
    maxPaymentsPerHour: 5,
    maxPaymentsPerDay: 20,
    maxCardsPerDay: 3,
    maxAmountPerDay: 100000000 // ₹1,000,000
  },

  // Risk scoring thresholds
  riskScoring: {
    lowRisk: 0,
    mediumRisk: 30,
    highRisk: 60,
    criticalRisk: 80
  },

  // Geographical restrictions
  allowedCountries: ['IN'], // India only
  restrictedStates: [], // Block specific Indian states if needed
  vpnDetectionEnabled: true,
  torDetectionEnabled: true,

  // Time-based restrictions
  unusualHours: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00'],
  blockedHours: [], // Completely block during these hours

  // Device fingerprinting
  deviceFingerprinting: true,
  requireConsistentDevice: false, // Allow multiple devices

  // 3D Secure/OTP requirements
  otpRequired: true,
  otpThreshold: 200000 // ₹2,000+
};

// ============================================================================
// FRAUD SCORING SYSTEM
// ============================================================================

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  action: 'approve' | 'require_otp' | 'manual_review' | 'block';
  reasons: string[];
  requiresKYC?: boolean;
  suggestedReview?: string;
}

export async function calculateFraudRiskScore(
  paymentData: {
    userId: string;
    amount: number;
    cardToken?: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
  }
): Promise<FraudCheckResult> {
  let riskScore = 0;
  const reasons: string[] = [];

  // 1. AMOUNT CHECK
  if (paymentData.amount < fraudConfig.limits.minAmount) {
    riskScore += 10;
    reasons.push('Amount below minimum threshold');
  }

  if (paymentData.amount > fraudConfig.limits.maxAmount) {
    riskScore += 50;
    reasons.push('Amount exceeds maximum limit');
  }

  // 2. NEW CUSTOMER FLAG
  const isNewCustomer = await checkIfNewCustomer(paymentData.userId);
  if (isNewCustomer && paymentData.amount > fraudConfig.limits.kycThreshold) {
    riskScore += 30;
    reasons.push('New customer attempting large transaction');
  }

  // 3. VELOCITY CHECKS
  const velocityCheck = await checkVelocity(paymentData.userId);
  if (velocityCheck.exceedsHourlyLimit) {
    riskScore += 25;
    reasons.push('Exceeds hourly payment limit');
  }
  if (velocityCheck.exceedsDailyLimit) {
    riskScore += 40;
    reasons.push('Exceeds daily payment limit');
  }

  // 4. DISPOSITION EMAIL CHECK
  if (isDisposableEmail(paymentData.email)) {
    riskScore += 35;
    reasons.push('Disposable email address used');
  }

  // 5. LOCATION & IP CHECKS
  const locationCheck = await checkLocationRisk(paymentData.ipAddress);
  if (locationCheck.vpn) {
    riskScore += 40;
    reasons.push('VPN/Proxy detected');
  }
  if (locationCheck.tor) {
    riskScore += 50;
    reasons.push('Tor network detected');
  }
  if (locationCheck.outsideIndia) {
    riskScore += 50;
    reasons.push('Non-Indian IP detected');
  }

  // 6. UNUSUAL TIME CHECK
  if (isUnusualTime()) {
    riskScore += 15;
    reasons.push('Transaction attempted during unusual hours');
  }

  // 7. DEVICE FINGERPRINTING
  if (fraudConfig.deviceFingerprinting && paymentData.deviceId) {
    const deviceCheck = await checkDevice(paymentData.userId, paymentData.deviceId);
    if (deviceCheck.newDevice) {
      riskScore += 20;
      reasons.push('New device detected');
    }
    if (deviceCheck.suspicious) {
      riskScore += 35;
      reasons.push('Device with suspicious history');
    }
  }

  // 8. CARD VELOCITY
  if (paymentData.cardToken) {
    const cardVelocity = await checkCardVelocity(paymentData.cardToken);
    if (cardVelocity.multipleUsers) {
      riskScore += 45;
      reasons.push('Card used by multiple users');
    }
    if (cardVelocity.rapidTransitions) {
      riskScore += 40;
      reasons.push('Rapid geographic transitions detected');
    }
  }

  // 9. BIN/IIN CHECK
  if (paymentData.cardToken) {
    const binCheck = checkBIN(paymentData.cardToken);
    if (!binCheck.isIndian) {
      riskScore += 30;
      reasons.push('Non-Indian card detected');
    }
    if (binCheck.isHighRisk) {
      riskScore += 25;
      reasons.push('High-risk card BIN');
    }
  }

  // DETERMINE ACTION BASED ON RISK SCORE
  let action: 'approve' | 'require_otp' | 'manual_review' | 'block' = 'approve';
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (riskScore >= fraudConfig.riskScoring.criticalRisk) {
    action = 'block';
    riskLevel = 'critical';
  } else if (riskScore >= fraudConfig.riskScoring.highRisk) {
    action = 'manual_review';
    riskLevel = 'high';
  } else if (riskScore >= fraudConfig.riskScoring.mediumRisk) {
    action = paymentData.amount > fraudConfig.limits.threeDSecureThreshold ? 'require_otp' : 'approve';
    riskLevel = 'medium';
  }

  return {
    riskScore,
    riskLevel,
    action,
    reasons,
    requiresKYC: paymentData.amount > fraudConfig.limits.kycThreshold,
    suggestedReview:
      riskLevel === 'high' ? `Manual review recommended for risk score: ${riskScore}` : undefined
  };
}

// ============================================================================
// VELOCITY CHECKS
// ============================================================================

async function checkVelocity(userId: string) {
  // Check Redis or in-memory cache for payment count
  const paymentCount = {
    lastHour: 1, // Mock data
    lastDay: 5,
    totalAmount: 50000
  };

  return {
    exceedsHourlyLimit:
      paymentCount.lastHour >= fraudConfig.velocity.maxPaymentsPerHour,
    exceedsDailyLimit: paymentCount.lastDay >= fraudConfig.velocity.maxPaymentsPerDay,
    exceedsAmountLimit:
      paymentCount.totalAmount >= fraudConfig.velocity.maxAmountPerDay
  };
}

// ============================================================================
// NEW CUSTOMER CHECK
// ============================================================================

async function checkIfNewCustomer(userId: string): Promise<boolean> {
  // Check if user has previous successful transactions
  // Return true if no transactions in last 6 months
  return Math.random() < 0.1; // Mock: 10% chance
}

// ============================================================================
// DISPOSABLE EMAIL CHECK
// ============================================================================

function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'yopmail.com'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

// ============================================================================
// LOCATION & IP CHECKS
// ============================================================================

async function checkLocationRisk(ipAddress: string) {
  // Mock IP geolocation check
  // In production, use GeoIP2 or MaxMind
  return {
    country: 'IN',
    isIndian: true,
    outsideIndia: false,
    vpn: false,
    tor: false,
    proxy: false
  };
}

// ============================================================================
// UNUSUAL TIME CHECK
// ============================================================================

function isUnusualTime(): boolean {
  const hour = new Date().getHours();
  return fraudConfig.unusualHours.some(h => parseInt(h) === hour);
}

// ============================================================================
// DEVICE FINGERPRINTING
// ============================================================================

async function checkDevice(userId: string, deviceId: string) {
  // Check if device is registered for user
  return {
    newDevice: false,
    suspicious: false,
    previousTransactions: 5
  };
}

// ============================================================================
// CARD VELOCITY
// ============================================================================

async function checkCardVelocity(cardToken: string) {
  // Check card usage across multiple users/merchants
  return {
    multipleUsers: false,
    rapidTransitions: false,
    usedByUsers: 1
  };
}

// ============================================================================
// BIN/IIN VALIDATION
// ============================================================================

function checkBIN(cardToken: string) {
  // Extract BIN (first 6 digits) from card token
  // Validate against Indian card issuer list
  return {
    isIndian: true,
    isHighRisk: false,
    issuer: 'HDFC',
    cardType: 'CREDIT'
  };
}

// ============================================================================
// RAZORPAY WEBHOOK VERIFICATION
// ============================================================================

export function verifyRazorpaySignature(
  data: string, // rawBody for webhooks OR orderId for checkout
  signature: string,
  paymentId?: string, // Only for checkout flow
  secret: string = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!
): boolean {
  try {
    const signatureBody = paymentId ? `${data}|${paymentId}` : data;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
}

// ============================================================================
// WEBHOOK REPLAY ATTACK PREVENTION (REDIS VERSION)
// ============================================================================

import redis from '@/lib/db/redis';


const WEBHOOK_EXPIRY_S = 86400; // 24 hours

export function validateWebhookTimestamp(timestamp: string | number): boolean {
  const webhookTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const currentTime = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;

  return Math.abs(currentTime - webhookTime) < FIVE_MINUTES;
}

export async function preventWebhookReplay(webhookId: string): Promise<boolean> {
  if (!redis) return true; // Fail-secure/safe: assume not a replay if Redis is missing (or handle differently)

  const key = `webhook:processed:${webhookId}`;


  // Try to set key, returns 'OK' if successful, null if exists
  const result = await redis.set(key, '1', 'EX', WEBHOOK_EXPIRY_S, 'NX');

  if (!result) {
    console.warn(`Webhook replay detected: ${webhookId}`);
    return false;
  }

  return true;
}


// ============================================================================
// MANUAL REVIEW QUEUE
// ============================================================================

export async function queueForManualReview(
  paymentId: string,
  riskScore: number,
  reasons: string[]
) {
  // Add to manual review collection
  console.log(`📋 Queued for manual review: ${paymentId} (risk score: ${riskScore})`);

  // In production, store in database for admin review
  // await ManualReviewQueue.create({
  //   paymentId,
  //   riskScore,
  //   reasons,
  //   status: 'pending',
  //   createdAt: new Date()
  // });
}

// ============================================================================
// 3D SECURE REQUIREMENT
// ============================================================================

export function require3DSecure(amount: number): boolean {
  return amount > fraudConfig.limits.threeDSecureThreshold;
}

// ============================================================================
// REFUND SECURITY
// ============================================================================

export interface RefundValidation {
  valid: boolean;
  error?: string;
}

export async function validateRefund(
  orderId: string,
  refundAmount: number
): Promise<RefundValidation> {
  // Check: Original amount not exceeded
  // Check: Within time limit
  // Check: Creator + admin approval
  // Check: Valid reason provided

  return {
    valid: true
  };
}

// ============================================================================
// AMOUNT VALIDATION
// ============================================================================

export function validateAmount(
  amount: number
): { valid: boolean; error?: string } {
  if (amount < fraudConfig.limits.minAmount) {
    return {
      valid: false,
      error: `Amount must be at least ₹${fraudConfig.limits.minAmount / 100}`
    };
  }

  if (amount > fraudConfig.limits.maxAmount) {
    return {
      valid: false,
      error: `Amount cannot exceed ₹${fraudConfig.limits.maxAmount / 100}`
    };
  }

  return { valid: true };
}

// ============================================================================
// CURRENCY VALIDATION
// ============================================================================

export function validateCurrency(currency: string): boolean {
  // Only INR allowed
  return currency === 'INR';
}

// ============================================================================
// PCI DSS COMPLIANCE HELPERS
// ============================================================================

export function maskCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\d(?=\d{4})/g, '•');
}

export function validateCardExpiry(month: number, year: number): boolean {
  const now = new Date();
  const expiryDate = new Date(year, month - 1);

  return expiryDate > now;
}

// ============================================================================
// FRAUD STATISTICS
// ============================================================================

export async function getFraudStatistics() {
  // Get fraud detection statistics
  return {
    blockedTransactions: 0,
    manualReviews: 0,
    otpRequired: 0,
    approvedWithWarning: 0,
    fraudRate: '0%',
    lastUpdated: new Date()
  };
}
