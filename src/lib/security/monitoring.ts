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

// ============================================================================
// SECURITY EVENT DATA STRUCTURE
// ============================================================================

export interface SecurityEvent {
  eventId: string;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  context: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
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

// ============================================================================
// EVENT STORAGE
// ============================================================================

const securityEvents: SecurityEvent[] = [];
const eventIdMap = new Map<string, SecurityEvent>();

export function recordSecurityEvent(
  eventType: SecurityEventType,
  context: Record<string, any>,
  ipAddress: string = 'unknown',
  userId?: string,
  userAgent?: string
): SecurityEvent {
  const event: SecurityEvent = {
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

  securityEvents.push(event);
  eventIdMap.set(event.eventId, event);

  // Keep last 50000 events
  if (securityEvents.length > 50000) {
    const removed = securityEvents.shift();
    if (removed) {
      eventIdMap.delete(removed.eventId);
    }
  }

  // Trigger alerts for critical/high severity
  if (event.severity === 'critical' || event.severity === 'high') {
    sendSecurityAlert(event);
  }

  return event;
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

async function sendEmailAlert(event: SecurityEvent, recipients: string[]) {
  const subject = `🚨 Security Alert - ${event.eventType}`;
  const body = `
Security Event Detected:
Event Type: ${event.eventType}
Severity: ${event.severity.toUpperCase()}
Time: ${event.timestamp.toISOString()}
User: ${event.userId || 'N/A'}
IP Address: ${event.ipAddress}
Context: ${JSON.stringify(event.context)}
  `;

  // TODO: Implement email service
  console.log(`📧 Email alert (not implemented): ${subject}`);
}

async function sendSMSAlert(event: SecurityEvent, recipients: string[]) {
  const message = `🚨 SECURITY ALERT: ${event.eventType} [${event.severity}] at ${new Date().toLocaleTimeString()}`;

  // TODO: Implement SMS service (Twilio, AWS SNS)
  console.log(`📱 SMS alert (not implemented): ${message}`);
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

export function getSecurityEvents(
  filters?: {
    eventType?: SecurityEventType;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    startTime?: Date;
    endTime?: Date;
    acknowledged?: boolean;
  },
  limit: number = 100
): SecurityEvent[] {
  let events = securityEvents;

  if (filters?.eventType) {
    events = events.filter(e => e.eventType === filters.eventType);
  }

  if (filters?.severity) {
    events = events.filter(e => e.severity === filters.severity);
  }

  if (filters?.startTime) {
    events = events.filter(e => e.timestamp >= filters.startTime!);
  }

  if (filters?.endTime) {
    events = events.filter(e => e.timestamp <= filters.endTime!);
  }

  if (filters?.acknowledged !== undefined) {
    events = events.filter(e => e.acknowledged === filters.acknowledged);
  }

  return events.slice(-limit);
}

export function acknowledgeEvent(eventId: string, acknowledgedBy: string): boolean {
  const event = eventIdMap.get(eventId);
  if (!event) return false;

  event.acknowledged = true;
  event.acknowledgedBy = acknowledgedBy;
  event.acknowledgedAt = new Date();

  return true;
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

export function getSecurityMetrics(): SecurityMetrics {
  const events = securityEvents;

  const criticalEvents = events.filter(e => e.severity === 'critical').length;
  const highEvents = events.filter(e => e.severity === 'high').length;
  const mediumEvents = events.filter(e => e.severity === 'medium').length;
  const lowEvents = events.filter(e => e.severity === 'low').length;

  const unacknowledgedCritical = events.filter(
    e => e.severity === 'critical' && !e.acknowledged
  ).length;

  // Calculate average response time
  const acknowledgedEvents = events.filter(e => e.acknowledged && e.acknowledgedAt);
  const avgResponseTime =
    acknowledgedEvents.length > 0
      ? acknowledgedEvents.reduce((sum, e) => {
          const responseTime =
            (e.acknowledgedAt!.getTime() - e.timestamp.getTime()) / 1000;
          return sum + responseTime;
        }, 0) / acknowledgedEvents.length
      : 0;

  // Get top event types
  const eventTypeCounts = new Map<SecurityEventType, number>();
  events.forEach(e => {
    eventTypeCounts.set(e.eventType, (eventTypeCounts.get(e.eventType) || 0) + 1);
  });

  const topEventTypes = Array.from(eventTypeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalEvents: events.length,
    criticalEvents,
    highEvents,
    mediumEvents,
    lowEvents,
    unacknowledgedCritical,
    averageResponseTime: avgResponseTime,
    topEventTypes
  };
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

export function detectAndCreateIncident(severity: 'critical' | 'high'): IncidentResponse | null {
  const recentCriticalEvents = getSecurityEvents({
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
