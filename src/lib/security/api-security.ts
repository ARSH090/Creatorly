/**
 * CREATORLY API SECURITY MIDDLEWARE
 * Comprehensive API protection: rate limiting, input validation, CORS, logging
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sanitizeQuery } from './database-security';

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export const rateLimitConfig = {
  // Generic rates
  global: {
    requestsPerMinute: 600,
    requestsPerHour: 36000
  },

  // Endpoint-specific rates
  endpoints: {
    public: {
      requestsPerHour: 100,
      requestsPerDay: 1000
    },
    authenticated: {
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    payment: {
      requestsPerHour: 50,
      requestsPerDay: 200
    },
    admin: {
      requestsPerHour: 500,
      requestsPerDay: 5000
    },
    auth: {
      loginAttempts: 5,
      loginWindow: 15 * 60 * 1000, // 15 minutes
      passwordReset: 3,
      passwordResetWindow: 24 * 60 * 60 * 1000
    }
  }
};

export function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof rateLimitConfig.endpoints,
  requestsAllowed?: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `rate_limit:${endpoint}:${identifier}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  // Get the allowed requests count
  const endpointConfig = rateLimitConfig.endpoints[endpoint] as any;
  const allowed = requestsAllowed || endpointConfig?.requestsPerHour || 100;

  if (!bucket || now > bucket.resetTime) {
    // New bucket
    const newBucket: RateLimitBucket = {
      count: 1,
      resetTime: now + 60 * 60 * 1000 // 1 hour
    };
    rateLimitBuckets.set(key, newBucket);

    return {
      allowed: true,
      remaining: allowed - 1,
      resetTime: newBucket.resetTime
    };
  }

  if (bucket.count >= allowed) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: bucket.resetTime
    };
  }

  bucket.count++;
  return {
    allowed: true,
    remaining: allowed - bucket.count,
    resetTime: bucket.resetTime
  };
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

export function validateRequestBody(
  body: any,
  schema: Record<string, { type: string; required: boolean; maxLength?: number }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    if (rules.required && !value) {
      errors.push(`Field '${field}' is required`);
      continue;
    }

    if (value && typeof value !== rules.type) {
      errors.push(`Field '${field}' must be of type ${rules.type}`);
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors.push(`Field '${field}' exceeds maximum length of ${rules.maxLength}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// ============================================================================
// INJECTION ATTACK PREVENTION
// ============================================================================

const injectionPatterns = [
  /(\$where|\$ne|\$gt|\$lt|\$regex)/gi,
  /(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\s+(FROM|INTO|.*)/gi,
  /(<script|javascript:|onerror=|onload=)/gi,
  /(\.\.\/|\.\.\\)/g // Path traversal
];

export function detectInjectionAttack(data: any): { detected: boolean; type?: string } {
  const stringData = JSON.stringify(data);

  for (const pattern of injectionPatterns) {
    if (pattern.test(stringData)) {
      pattern.lastIndex = 0; // Reset regex
      return { detected: true, type: 'injection_attack' };
    }
  }

  return { detected: false };
}

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

export const corsConfig = {
  allowedOrigins: [
    'https://creatorly.in',
    'https://www.creatorly.in',
    'https://admin.creatorly.in'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept'
  ],
  credentials: true,
  maxAge: 86400
};

export function validateCORS(
  origin: string | undefined,
  method: string
): { allowed: boolean; headers: Record<string, string> } {
  if (!origin) {
    return { allowed: false, headers: {} };
  }

  const isAllowed = corsConfig.allowedOrigins.includes(origin);

  if (!isAllowed) {
    console.warn(`CORS violation attempt from origin: ${origin}`);
    return { allowed: false, headers: {} };
  }

  return {
    allowed: true,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': corsConfig.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': corsConfig.maxAge.toString()
    }
  };
}

// ============================================================================
// REQUEST LOGGING
// ============================================================================

export interface APILog {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  requestSize: number;
  responseSize: number;
  error?: string;
}

const requestLogs: APILog[] = [];

export function logAPIRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  ipAddress: string,
  userAgent: string,
  userId?: string,
  error?: string
) {
  const log: APILog = {
    timestamp: new Date(),
    method,
    path,
    statusCode,
    duration,
    userId,
    ipAddress,
    userAgent,
    requestSize: 0,
    responseSize: 0,
    error
  };

  requestLogs.push(log);

  // Keep last 10000 logs in memory
  if (requestLogs.length > 10000) {
    requestLogs.shift();
  }

  // Log errors
  if (error) {
    console.error(`[${statusCode}] ${method} ${path}: ${error}`);
  }
}

export function getAPILogs(count: number = 100): APILog[] {
  return requestLogs.slice(-count);
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

const csrfTokens = new Map<string, { token: string; createdAt: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now()
  });
  return token;
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check token expiry (1 hour)
  if (Date.now() - stored.createdAt > 60 * 60 * 1000) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

export async function applySecurityMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomBytes(8).toString('hex');
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Add headers
  const response = NextResponse.next();
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Log request
  const duration = Date.now() - startTime;
  logAPIRequest(
    request.method,
    request.nextUrl.pathname,
    response.status,
    duration,
    ipAddress,
    userAgent
  );

  return response;
}

// ============================================================================
// ENDPOINT PROTECTION DECORATOR
// ============================================================================

export function protectEndpoint(endpoint: keyof typeof rateLimitConfig.endpoints) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: NextRequest) {
      const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

      // Check rate limit
      const rateLimit = checkRateLimit(ipAddress, endpoint);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '50',
              'X-RateLimit-Remaining': String(rateLimit.remaining),
              'X-RateLimit-Reset': String(rateLimit.resetTime)
            }
          }
        );
      }

      // Check CORS
      const origin = req.headers.get('origin');
      const corsCheck = validateCORS(origin || '', req.method);

      if (!corsCheck.allowed && origin) {
        return NextResponse.json(
          { error: 'CORS policy violation' },
          { status: 403 }
        );
      }

      // Call original method
      return originalMethod.call(this, req);
    };

    return descriptor;
  };
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

export interface AnomalyAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  context: Record<string, any>;
}

const anomalyAlerts: AnomalyAlert[] = [];

export function detectAnomalies(): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  // Analyze recent logs
  const recentLogs = getAPILogs(100);

  // Check for error rate spike
  const errorCount = recentLogs.filter(log => log.statusCode >= 400).length;
  if (errorCount > recentLogs.length * 0.5) {
    alerts.push({
      type: 'error_spike',
      severity: 'high',
      message: 'High error rate detected',
      timestamp: new Date(),
      context: { errorRate: errorCount / recentLogs.length }
    });
  }

  // Check for slowdown
  const avgDuration = recentLogs.reduce((sum, log) => sum + log.duration, 0) / recentLogs.length;
  if (avgDuration > 5000) {
    alerts.push({
      type: 'performance_degradation',
      severity: 'medium',
      message: 'API performance degradation detected',
      timestamp: new Date(),
      context: { avgDuration }
    });
  }

  return alerts;
}
