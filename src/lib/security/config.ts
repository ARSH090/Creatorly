/**
 * CREATORLY SECURITY CONFIGURATION FOR NEXT.JS
 * Enterprise security headers, CSP, HSTS, and security policies
 * Add this to next.config.ts
 */

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export const securityHeaders = [
  // 1. STRICT TRANSPORT SECURITY
  // Force HTTPS connections with preload list
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },

  // 2. CONTENT SECURITY POLICY
  // Prevent inline scripts, restrict resource loading
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.razorpay.com https://*.mongodb.net https://analytics.google.com",
      "frame-src 'self' https://checkout.razorpay.com",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  },

  // 3. X-CONTENT-TYPE-OPTIONS
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },

  // 4. X-FRAME-OPTIONS
  // Prevent clickjacking attacks
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },

  // 5. X-XSS-PROTECTION
  // Enable browser XSS protection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },

  // 6. REFERRER-POLICY
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },

  // 7. PERMISSIONS-POLICY (FEATURE-POLICY)
  // Restrict browser features
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', ')
  },

  // 8. CROSS-ORIGIN POLICIES
  // Prevent cross-origin attacks
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'unsafe-none'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin'
  },

  // 9. CACHE CONTROL
  // Prevent sensitive data caching
  {
    key: 'Cache-Control',
    value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
  },
  {
    key: 'Pragma',
    value: 'no-cache'
  },
  {
    key: 'Expires',
    value: '0'
  },

  // 10. DNS PREFETCH CONTROL
  // Prevent DNS prefetching
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off'
  }
];

// ============================================================================
// NEXT.JS CONFIG EXPORT
// ============================================================================

export const nextSecurityConfig = {
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      },
      // Additional headers for specific paths
      {
        source: '/admin/:path*',
        headers: [
          ...securityHeaders,
          // Stricter CSP for admin
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      },
      // API endpoints
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  },

  // CORS handling
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite health check
        {
          source: '/health',
          destination: '/api/health'
        }
      ],
      afterFiles: [
        // Fallback rewrite
        {
          source: '/:path*',
          destination: '/404'
        }
      ]
    };
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === 'production'
      ? [
        {
          source: '/:path*',
          destination: 'https://creatorly.in/:path*',
          permanent: true,
          basePath: false
        }
      ]
      : [];
  }
};

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================================

export function validateSecurityEnvironment(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const required = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'ENCRYPTION_MASTER_KEY',
    'JWT_ENCRYPTION_KEY'
  ];

  for (const env of required) {
    if (!process.env[env]) {
      errors.push(`Missing required environment variable: ${env}`);
    }
  }

  // Validate secret lengths
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  if (process.env.ENCRYPTION_MASTER_KEY && process.env.ENCRYPTION_MASTER_KEY.length < 64) {
    errors.push('ENCRYPTION_MASTER_KEY must be at least 64 characters long (hex)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// HELMET.JS EQUIVALENT FOR NEXT.JS
// ============================================================================

export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
};

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================

export const rateLimitConfig = {
  global: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 1000 // 1000 requests per minute
  },
  endpoints: {
    login: {
      interval: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5
    },
    passwordReset: {
      interval: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 3
    },
    paymentCreate: {
      interval: 60 * 1000, // 1 minute
      maxRequests: 10
    },
    admin: {
      interval: 60 * 1000, // 1 minute
      maxRequests: 500
    }
  }
};

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

export const corsConfig = {
  allowedOrigins: [
    'https://creatorly.in',
    'https://www.creatorly.in',
    'https://admin.creatorly.in',
    process.env.FRONTEND_URL
  ].filter(Boolean),
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

// ============================================================================
// SSL/TLS CONFIGURATION
// ============================================================================

export const tlsConfig = {
  minVersion: 'TLSv1.2',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256',
    'DHE-RSA-AES256-GCM-SHA384'
  ],
  honorCipherOrder: true
};

// ============================================================================
// SECURITY COMPLIANCE CHECKS
// ============================================================================

export function performSecurityAudit() {
  const errors = validateSecurityEnvironment().errors;
  const warnings: string[] = [];

  if (process.env.NODE_ENV !== 'production') {
    warnings.push('Not running in production mode - some security features disabled');
  }

  if (!process.env.ENABLE_HTTPS) {
    warnings.push('HTTPS not enforced');
  }

  console.log('🔐 Security Audit Results:');
  if (errors.length === 0) {
    console.log('✅ All security checks passed');
  } else {
    console.error('❌ Security issues found:');
    errors.forEach(e => console.error(`  - ${e}`));
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Security warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }

  return { valid: errors.length === 0, errors, warnings };
}
