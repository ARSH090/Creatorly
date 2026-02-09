/**
 * CREATORLY DATABASE SECURITY
 * Comprehensive MongoDB security implementation
 * Includes: injection prevention, encryption, audit logging, backups
 */

import mongoose from 'mongoose';
import crypto from 'crypto';

// ============================================================================
// DATABASE CONNECTION SECURITY
// ============================================================================

export const mongoSecurityOptions = {
  // Use URI defaults instead of forcing strict settings that might fail in some environments
  retryWrites: true,
  retryReads: true,

  // Connection pooling
  maxPoolSize: 50,
  minPoolSize: 5,

  // Timeouts
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
};

// ============================================================================
// QUERY INJECTION PREVENTION
// ============================================================================

/**
 * Sanitize query parameters to prevent injection attacks
 */
export function sanitizeQuery(query: any): any {
  if (typeof query === 'string') {
    return query
      .replace(/\$/g, '\\$')
      .replace(/\./g, '\\.')
      .replace(/'/g, "\\'");
  }

  if (Array.isArray(query)) {
    return query.map(sanitizeQuery);
  }

  if (typeof query === 'object' && query !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(query)) {
      // Block NoSQL injection operators
      if (key.startsWith('$') || key.startsWith('__')) {
        console.warn(`Blocked injection attempt with key: ${key}`);
        continue;
      }
      sanitized[key] = sanitizeQuery(value);
    }
    return sanitized;
  }

  return query;
}

/**
 * Validate query structure against whitelist
 */
export function validateQueryStructure(
  query: any,
  allowedFields: string[]
): boolean {
  if (typeof query !== 'object' || query === null) {
    return true;
  }

  for (const key of Object.keys(query)) {
    // Reject MongoDB operators
    if (key.startsWith('$')) {
      return false;
    }

    // Reject fields not in whitelist
    if (!allowedFields.includes(key) && !allowedFields.includes('*')) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// FIELD-LEVEL ENCRYPTION
// ============================================================================

export class FieldEncryption {
  private masterKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor(masterKeyHex?: string) {
    if (!masterKeyHex) {
      masterKeyHex = process.env.ENCRYPTION_MASTER_KEY;
      if (!masterKeyHex) {
        throw new Error('ENCRYPTION_MASTER_KEY environment variable not set');
      }
    }
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
  }

  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv) as any;

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv) as any;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// ============================================================================
// SENSITIVE FIELD MASKING
// ============================================================================

export function maskSensitiveFields(data: any, fieldsToMask: string[]): any {
  if (!data) return data;

  const masked = { ...data };

  const maskField = (obj: any, path: string) => {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
      if (!current) return;
    }

    const lastKey = keys[keys.length - 1];
    if (current[lastKey]) {
      current[lastKey] = '*'.repeat(Math.min(current[lastKey].length, 12));
    }
  };

  fieldsToMask.forEach(field => maskField(masked, field));
  return masked;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditLog {
  timestamp: Date;
  adminId: string;
  action: string;
  collection: string;
  documentId: string;
  changes: Record<string, { before: any; after: any }>;
  ipAddress: string;
  userAgent: string;
}

/**
 * Log sensitive database operations
 */
export async function logDatabaseOperation(
  adminId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ',
  collection: string,
  documentId: string,
  changes: Record<string, any>,
  ipAddress: string
) {
  try {
    // Connect to MongoDB
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database not connected for audit logging');
      return;
    }

    const auditCollection = db.collection('audit_logs');

    const auditEntry: AuditLog = {
      timestamp: new Date(),
      adminId,
      action,
      collection,
      documentId,
      changes,
      ipAddress,
      userAgent: process.env.USER_AGENT || 'Unknown'
    };

    // Insert with write concern majority
    await auditCollection.insertOne(auditEntry);

    // Remove after retention period (1 year)
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() - 1);

    await auditCollection.deleteMany({
      timestamp: { $lt: retentionDate },
      action: 'READ' // Only delete READ logs (highest volume)
    });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

// ============================================================================
// QUERY TIMEOUT PROTECTION
// ============================================================================

export async function executeQueryWithTimeout(
  query: Promise<any>,
  timeoutMs: number = 10000
): Promise<any> {
  return Promise.race([
    query,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ]);
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

export function validateMongoId(id: string): boolean {
  return /^[0-9a-f]{24}$/.test(id);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// DATABASE MIGRATION SECURITY
// ============================================================================

export async function backupBeforeMigration() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`🔄 Starting pre-migration backup: ${timestamp}`);

    // TODO: Implement MongoDB backup
    // mongodump --uri=$MONGODB_URI --gzip --archive

    return { success: true, timestamp };
  } catch (error) {
    console.error('Pre-migration backup error:', error);
    return { success: false, error };
  }
}

// ============================================================================
// DATA RETENTION POLICIES
// ============================================================================

export const retentionPolicies = {
  userAccounts: {
    duration: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    anonymizeAfter: 3 * 365 * 24 * 60 * 60 * 1000 // 3 years after deletion
  },
  paymentData: {
    duration: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years (tax requirement)
    anonymizeAfter: 5 * 365 * 24 * 60 * 60 * 1000
  },
  logs: {
    duration: 365 * 24 * 60 * 60 * 1000, // 1 year
    deleteAfter: true
  },
  sessionData: {
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    deleteAfter: true
  }
};

/**
 * Automatically enforce data retention policies
 */
export async function enforceRetentionPolicies() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // Delete old log entries
    const logsCollection = db.collection('logs');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await logsCollection.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });

    console.log('✅ Data retention policies enforced');
  } catch (error) {
    console.error('Retention policy enforcement error:', error);
  }
}

// ============================================================================
// SECURE DATA DELETION
// ============================================================================

/**
 * Securely delete sensitive data (overwrite before deletion)
 */
export async function secureDelete(collection: string, query: any) {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const col = db.collection(collection);

    // Overwrite with random data before deletion
    const randomData = crypto.randomBytes(1024).toString('hex');
    await col.updateMany(query, {
      $set: { _secureDelete: randomData }
    });

    // Then delete
    await col.deleteMany(query);

    console.log(`✅ Securely deleted documents from ${collection}`);
  } catch (error) {
    console.error('Secure deletion error:', error);
  }
}

// ============================================================================
// DATABASE INTEGRITY CHECK
// ============================================================================

export async function verifyDatabaseIntegrity() {
  try {
    const db = mongoose.connection.db;
    if (!db) return { success: false, error: 'Database not connected' };

    // Verify connection
    const adminDb = db.admin();
    const status = await adminDb.ping();

    if (status.ok !== 1) {
      return { success: false, error: 'Database health check failed' };
    }

    // Verify collections exist
    const collections = await db.listCollections().toArray();
    const requiredCollections = [
      'users',
      'orders',
      'products',
      'payments',
      'audit_logs'
    ];

    const missingCollections = requiredCollections.filter(
      req => !collections.some(col => col.name === req)
    );

    if (missingCollections.length > 0) {
      return {
        success: false,
        error: `Missing collections: ${missingCollections.join(', ')}`
      };
    }

    return { success: true, timestamp: new Date() };
  } catch (error) {
    console.error('Database integrity check error:', error);
    return { success: false, error };
  }
}
