/**
 * CREATORLY SECURITY MONITORING & ALERTING SYSTEM
 * Real-time security event detection and emergency alerts
 */

import crypto from 'crypto';

// ============================================================================
// SECURITY EVENT TYPES
// ============================================================================

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_UNUSUAL_TIME = 'LOGIN_UNUSUAL_TIME',
  LOGIN_NEW_DEVICE = 'LOGIN_NEW_DEVICE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TWO_FA_SETUP = 'TWO_FA_SETUP',

  // Payment events
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_FRAUD_DETECTED = 'PAYMENT_FRAUD_DETECTED',
  PAYMENT_AMOUNT_UNUSUAL = 'PAYMENT_AMOUNT_UNUSUAL',
  REFUND_INITIATED = 'REFUND_INITIATED',
  CHARGEBACK_INITIATED = 'CHARGEBACK_INITIATED',

  // Admin events
  ADMIN_ACTION = 'ADMIN_ACTION',
  ADMIN_UNAUTHORIZED_ACCESS = 'ADMIN_UNAUTHORIZED_ACCESS',
  ADMIN_ACCOUNT_COMPROMISE = 'ADMIN_ACCOUNT_COMPROMISE',
  ADMIN_DATA_EXPORT = 'ADMIN_DATA_EXPORT',

  // API events
  API_ATTACK_DETECTED = 'API_ATTACK_DETECTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INJECTION_ATTEMPT = 'INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',

  // Data events
  DATA_BREACH_POTENTIAL = 'DATA_BREACH_POTENTIAL',
  UNAUTHORIZED_DATA_ACCESS = 'UNAUTHORIZED_DATA_ACCESS',
  BULK_DATA_EXPORT = 'BULK_DATA_EXPORT',

  // Infrastructure events
  DATABASE_HEALTH_CRITICAL = 'DATABASE_HEALTH_CRITICAL',
  API_DEGRADATION = 'API_DEGRADATION',
  BACKUP_FAILED = 'BACKUP_FAILED',
  SSL_CERTIFICATE_EXPIRING = 'SSL_CERTIFICATE_EXPIRING'
}

import { ISecurityEvent } from '../models/SecurityEvent';

// We map SecurityEventType to the DB's eventType string
export interface SecurityEvent extends Omit<ISecurityEvent, keyof import('mongoose').Document> {
  eventType: SecurityEventType | string;
}

// ============================================================================
// EVENT SEVERITY MAPPING
// ============================================================================

const severityMap: Record<SecurityEventType, 'low' | 'medium' | 'high' | 'critical'> = {
  [SecurityEventType.LOGIN_SUCCESS]: 'low',
  [SecurityEventType.LOGIN_FAILED]: 'medium',
  [SecurityEventType.LOGIN_UNUSUAL_TIME]: 'medium',
  [SecurityEventType.LOGIN_NEW_DEVICE]: 'medium',
  [SecurityEventType.ACCOUNT_LOCKED]: 'high',
  [SecurityEventType.PASSWORD_CHANGED]: 'low',
  [SecurityEventType.TWO_FA_SETUP]: 'low',

  [SecurityEventType.PAYMENT_SUCCESS]: 'low',
  [SecurityEventType.PAYMENT_FAILED]: 'low',
  [SecurityEventType.PAYMENT_FRAUD_DETECTED]: 'high',
  [SecurityEventType.PAYMENT_AMOUNT_UNUSUAL]: 'medium',
  [SecurityEventType.REFUND_INITIATED]: 'low',
  [SecurityEventType.CHARGEBACK_INITIATED]: 'high',

  [SecurityEventType.ADMIN_ACTION]: 'low',
  [SecurityEventType.ADMIN_UNAUTHORIZED_ACCESS]: 'critical',
  [SecurityEventType.ADMIN_ACCOUNT_COMPROMISE]: 'critical',
  [SecurityEventType.ADMIN_DATA_EXPORT]: 'high',

  [SecurityEventType.API_ATTACK_DETECTED]: 'high',
  [SecurityEventType.RATE_LIMIT_EXCEEDED]: 'medium',
  [SecurityEventType.INJECTION_ATTEMPT]: 'high',
  [SecurityEventType.XSS_ATTEMPT]: 'high',

  [SecurityEventType.DATA_BREACH_POTENTIAL]: 'critical',
  [SecurityEventType.UNAUTHORIZED_DATA_ACCESS]: 'critical',
  [SecurityEventType.BULK_DATA_EXPORT]: 'critical',

  [SecurityEventType.DATABASE_HEALTH_CRITICAL]: 'critical',
  [SecurityEventType.API_DEGRADATION]: 'high',
  [SecurityEventType.BACKUP_FAILED]: 'high',
  [SecurityEventType.SSL_CERTIFICATE_EXPIRING]: 'medium'
};

import SecurityEventModel from '../models/SecurityEvent';
import { connectToDatabase } from '../db/mongodb';

export async function recordSecurityEvent(
  eventType: SecurityEventType,
  context: Record<string, any>,
  ipAddress: string = 'unknown',
  userId?: string,
  userAgent?: string
): Promise<any> {
  try {
    const event = {
      eventId: crypto.randomBytes(8).toString('hex'),
      eventType,
      severity: severityMap[eventType],
      timestamp: new Date(),
      userId,
      ipAddress,
      userAgent,
      context,
      acknowledged: false
    };

    await connectToDatabase();
    await SecurityEventModel.create(event);

    // Trigger alerts for critical/high severity
    if (event.severity === 'critical' || event.severity === 'high') {
      sendSecurityAlert(event as any);
    }

    return event;
  } catch (error) {
    console.error('Failed to record security event:', error);
  }
}

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

export interface SecurityAlert {
  alertId: string;
  eventId: string;
  channel: 'email' | 'sms' | 'slack' | 'webhook' | 'dashboard';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  failureReason?: string;
  recipients: string[];
}

const sentAlerts: SecurityAlert[] = [];

async function sendSecurityAlert(event: SecurityEvent) {
  // Multi-channel alerting based on severity
  const channels: Array<'email' | 'sms' | 'slack' | 'webhook' | 'dashboard'> = [];

  if (event.severity === 'critical') {
    channels.push('email', 'sms', 'slack', 'webhook');
  } else if (event.severity === 'high') {
    channels.push('email', 'slack', 'webhook');
  }

  for (const channel of channels) {
    await sendAlert(event, channel);
  }
}

async function sendAlert(event: SecurityEvent, channel: string) {
  try {
    let recipients: string[] = [];

    switch (channel) {
      case 'email':
        recipients = [process.env.SECURITY_ALERT_EMAIL || ''];
        await sendEmailAlert(event, recipients);
        break;

      case 'sms':
        recipients = [process.env.SECURITY_ALERT_PHONE || ''];
        await sendSMSAlert(event, recipients);
        break;

      case 'slack':
        await sendSlackAlert(event);
        break;

      case 'webhook':
        await sendWebhookAlert(event);
        break;

      case 'dashboard':
        // Dashboard alert is automatic
        recipients = ['dashboard'];
        break;
    }

    const alert: SecurityAlert = {
      alertId: crypto.randomBytes(8).toString('hex'),
      eventId: event.eventId,
      channel: channel as any,
      status: 'sent',
      sentAt: new Date(),
      recipients
    };

    sentAlerts.push(alert);
  } catch (error) {
    console.error(`Failed to send ${channel} alert:`, error);
  }
}

// ============================================================================
// ALERT CHANNELS
// ============================================================================

import { sendEmail } from '../services/email';

async function sendEmailAlert(event: SecurityEvent, recipients: string[]) {
  const subject = `🚨 Security Alert - ${event.eventType}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 6px; padding: 20px;">
          <h2 style="color: #d73a49; border-bottom: 1px solid #e1e4e8; padding-bottom: 10px;">Security Alert Detected</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; font-weight: bold;">Event Type:</td><td>${event.eventType}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Severity:</td><td style="color: ${event.severity === 'critical' ? '#d73a49' : '#f66a0a'}">${event.severity.toUpperCase()}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">Time:</td><td>${event.timestamp.toISOString()}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">User:</td><td>${event.userId || 'Guest'}</td></tr>
            <tr><td style="padding: 5px 0; font-weight: bold;">IP Address:</td><td>${event.ipAddress}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 10px; background: #f6f8fa; border-radius: 6px;">
            <strong style="display: block; margin-bottom: 5px;">Context:</strong>
            <pre style="white-space: pre-wrap; margin: 0; font-size: 12px;">${JSON.stringify(event.context, null, 2)}</pre>
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #586069; border-top: 1px solid #e1e4e8; padding-top: 10px;">
            This is an automated security alert from Creatorly.
          </div>
        </div>
      </body>
    </html>
  `;

  for (const to of recipients) {
    if (to) {
      await sendEmail({ to, subject, html });
    }
  }
}

async function sendSMSAlert(event: SecurityEvent, recipients: string[]) {
  const message = `🚨 SECURITY ALERT: ${event.eventType} [${event.severity}] at ${new Date().toLocaleTimeString()}`;

  // Fallback to console since SMS provider is not configured
  console.warn('\n' + '!'.repeat(50));
  console.warn(message);
  console.warn(`Recipients: ${recipients.join(', ')}`);
  console.warn('Context:', JSON.stringify(event.context, null, 2));
  console.warn('!'.repeat(50) + '\n');
}

async function sendSlackAlert(event: SecurityEvent) {
  const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK;
  if (!webhookUrl) return;

  const color =
    event.severity === 'critical' ? 'danger' : event.severity === 'high' ? 'warning' : 'good';

  const payload = {
    attachments: [
      {
        color,
        title: `🚨 ${event.eventType}`,
        fields: [
          { title: 'Severity', value: event.severity.toUpperCase(), short: true },
          { title: 'Time', value: event.timestamp.toISOString(), short: true },
          { title: 'User ID', value: event.userId || 'N/A', short: true },
          { title: 'IP Address', value: event.ipAddress, short: true },
          { title: 'Context', value: JSON.stringify(event.context, null, 2), short: false }
        ]
      }
    ]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

async function sendWebhookAlert(event: SecurityEvent) {
  const webhookUrl = process.env.SECURITY_WEBHOOK;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (error) {
    console.error('Failed to send webhook alert:', error);
  }
}

// ============================================================================
// EVENT QUERYING
// ============================================================================

// ============================================================================
// DATABASE QUERYING (FOR DASHBOARD)
// ============================================================================

export async function getSecurityEventsDB(
  filters?: {
    eventType?: SecurityEventType;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    startTime?: Date;
    endTime?: Date;
    acknowledged?: boolean;
  },
  limit: number = 20
): Promise<any[]> {
  try {
    await connectToDatabase();
    const query: any = {};

    if (filters?.eventType) query.eventType = filters.eventType;
    if (filters?.severity) query.severity = filters.severity;
    if (filters?.acknowledged !== undefined) query.acknowledged = filters.acknowledged;

    if (filters?.startTime || filters?.endTime) {
      query.timestamp = {};
      if (filters?.startTime) query.timestamp.$gte = filters.startTime;
      if (filters?.endTime) query.timestamp.$lte = filters.endTime;
    }

    return await SecurityEventModel.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('getSecurityEventsDB error:', error);
    return [];
  }
}

export async function getSecurityMetricsDB(): Promise<SecurityMetrics> {
  try {
    await connectToDatabase();
    const stats = await SecurityEventModel.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const metricsMap: any = { critical: 0, high: 0, medium: 0, low: 0 };
    stats.forEach(s => metricsMap[s._id] = s.count);

    const totalEvents = stats.reduce((sum, s) => sum + s.count, 0);
    const unacknowledgedCritical = await SecurityEventModel.countDocuments({
      severity: 'critical',
      acknowledged: false
    });

    const topEvents = await SecurityEventModel.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return {
      totalEvents,
      criticalEvents: metricsMap.critical,
      highEvents: metricsMap.high,
      mediumEvents: metricsMap.medium,
      lowEvents: metricsMap.low,
      unacknowledgedCritical,
      averageResponseTime: 0, // Metric not yet tracked in DB
      topEventTypes: topEvents.map(t => ({ type: t._id as SecurityEventType, count: t.count }))
    };
  } catch (error) {
    console.error('getSecurityMetricsDB error:', error);
    return {
      totalEvents: 0,
      criticalEvents: 0,
      highEvents: 0,
      mediumEvents: 0,
      lowEvents: 0,
      unacknowledgedCritical: 0,
      averageResponseTime: 0,
      topEventTypes: []
    };
  }
}

export async function getSecurityEvents(
  filters?: {
    eventType?: SecurityEventType | string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    startTime?: Date;
    endTime?: Date;
    acknowledged?: boolean;
  },
  limit: number = 20
): Promise<any[]> {
  try {
    await connectToDatabase();
    const query: any = {};

    if (filters?.eventType) query.eventType = filters.eventType;
    if (filters?.severity) query.severity = filters.severity;
    if (filters?.acknowledged !== undefined) query.acknowledged = filters.acknowledged;

    if (filters?.startTime || filters?.endTime) {
      query.timestamp = {};
      if (filters?.startTime) query.timestamp.$gte = filters.startTime;
      if (filters?.endTime) query.timestamp.$lte = filters.endTime;
    }

    return await SecurityEventModel.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('getSecurityEvents error:', error);
    return [];
  }
}

export async function acknowledgeEvent(eventId: string, acknowledgedBy: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const result = await SecurityEventModel.findOneAndUpdate(
      { eventId },
      {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date()
      },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error('acknowledgeEvent error:', error);
    return false;
  }
}

// ============================================================================
// SECURITY METRICS
// ============================================================================

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  mediumEvents: number;
  lowEvents: number;
  unacknowledgedCritical: number;
  averageResponseTime: number;
  topEventTypes: Array<{ type: SecurityEventType; count: number }>;
}

export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  return await getSecurityMetricsDB();
}

// ============================================================================
// INCIDENT RESPONSE
// ============================================================================

export interface IncidentResponse {
  incidentId: string;
  triggeredEvents: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

const incidents: IncidentResponse[] = [];

export async function detectAndCreateIncident(severity: 'critical' | 'high'): Promise<IncidentResponse | null> {
  const recentCriticalEvents = await getSecurityEvents({
    severity,
    acknowledged: false,
    startTime: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
  });

  if (recentCriticalEvents.length >= 3) {
    const incident: IncidentResponse = {
      incidentId: crypto.randomBytes(8).toString('hex'),
      triggeredEvents: recentCriticalEvents.map(e => e.eventId),
      severity,
      status: 'open',
      createdAt: new Date()
    };

    incidents.push(incident);
    console.error(`🚨 INCIDENT CREATED: ${incident.incidentId}`);

    return incident;
  }

  return null;
}

export function getIncidents(status?: string): IncidentResponse[] {
  return status ? incidents.filter(i => i.status === status) : incidents;
}

export function resolveIncident(incidentId: string, resolutionNotes: string): boolean {
  const incident = incidents.find(i => i.incidentId === incidentId);
  if (!incident) return false;

  incident.status = 'resolved';
  incident.resolvedAt = new Date();
  incident.resolutionNotes = resolutionNotes;

  return true;
}
