/**
 * Automated Alerts System for Creatorly
 * Monitors critical metrics and sends notifications
 */

import { sendEmail } from '@/lib/services/email';

export interface AlertConfig {
  errorRateThreshold: number; // e.g., 0.05 for 5%
  responseTimeThreshold: number; // in ms
  paymentFailureThreshold: number; // percentage
  databaseLatencyThreshold: number; // in ms
  checkInterval: number; // in seconds
  slackWebhook?: string;
  emailAlerts?: string[];
}

interface Alert {
  id: string;
  type: 'error_rate' | 'response_time' | 'payment' | 'database' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metrics?: Record<string, number>;
}

class AlertsSystem {
  private config: AlertConfig;
  private alerts: Alert[] = [];
  private metrics = {
    errorRate: 0,
    responseTime: 0,
    paymentFailureRate: 0,
    databaseLatency: 0,
  };

  constructor(config: AlertConfig) {
    this.config = config;
    this.startMonitoring();
  }

  private startMonitoring() {
    setInterval(() => {
      this.checkMetrics();
    }, this.config.checkInterval * 1000);
  }

  private async checkMetrics() {
    // Check error rate
    if (this.metrics.errorRate > this.config.errorRateThreshold) {
      this.createAlert({
        type: 'error_rate',
        severity: 'critical',
        message: `Error rate ${(this.metrics.errorRate * 100).toFixed(2)}% exceeds threshold ${(this.config.errorRateThreshold * 100).toFixed(2)}%`,
        metrics: { errorRate: this.metrics.errorRate },
      });
    }

    // Check response time
    if (this.metrics.responseTime > this.config.responseTimeThreshold) {
      this.createAlert({
        type: 'response_time',
        severity: 'high',
        message: `Average response time ${this.metrics.responseTime}ms exceeds threshold ${this.config.responseTimeThreshold}ms`,
        metrics: { responseTime: this.metrics.responseTime },
      });
    }

    // Check payment failures
    if (this.metrics.paymentFailureRate > this.config.paymentFailureThreshold) {
      this.createAlert({
        type: 'payment',
        severity: 'critical',
        message: `Payment failure rate ${(this.metrics.paymentFailureRate * 100).toFixed(2)}% exceeds threshold`,
        metrics: { paymentFailureRate: this.metrics.paymentFailureRate },
      });
    }

    // Check database latency
    if (this.metrics.databaseLatency > this.config.databaseLatencyThreshold) {
      this.createAlert({
        type: 'database',
        severity: 'high',
        message: `Database latency ${this.metrics.databaseLatency}ms exceeds threshold ${this.config.databaseLatencyThreshold}ms`,
        metrics: { databaseLatency: this.metrics.databaseLatency },
      });
    }
  }

  private async createAlert(alert: Omit<Alert, 'id' | 'timestamp'>) {
    const fullAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.alerts.push(fullAlert);

    // Remove old alerts (keep last 1000)
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Send notifications
    await this.notifyAlert(fullAlert);
  }

  private async notifyAlert(alert: Alert) {
    // Send email alerts
    if (this.config.emailAlerts && this.config.emailAlerts.length > 0) {
      const emailContent = this.formatAlertEmail(alert);
      for (const email of this.config.emailAlerts) {
        await sendEmail({
          to: email,
          subject: `[${alert.severity.toUpperCase()}] Creatorly Alert - ${alert.type}`,
          html: emailContent,
        });
      }
    }

    // Send Slack notification
    if (this.config.slackWebhook) {
      await this.sendSlackAlert(alert);
    }

    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  private formatAlertEmail(alert: Alert): string {
    const severityColors = {
      low: '#FFA500',
      medium: '#FF6B6B',
      high: '#FF0000',
      critical: '#8B0000',
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert-header { 
              background-color: ${severityColors[alert.severity]};
              color: white;
              padding: 15px;
              border-radius: 4px;
              margin-bottom: 20px;
            }
            .alert-content { background: #f5f5f5; padding: 15px; border-radius: 4px; }
            .metric { margin: 10px 0; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert-header">
              <h2>Creatorly Alert</h2>
              <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            </div>
            
            <div class="alert-content">
              <p><strong>Type:</strong> ${alert.type}</p>
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
              
              ${alert.metrics ? `
                <h3>Metrics:</h3>
                ${Object.entries(alert.metrics).map(([key, value]) => `
                  <div class="metric"><strong>${key}:</strong> ${value}</div>
                `).join('')}
              ` : ''}
            </div>
            
            <div class="footer">
              <p>Please check your monitoring dashboard for more details.</p>
              <p>&copy; 2026 Creatorly</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private async sendSlackAlert(alert: Alert) {
    if (!this.config.slackWebhook) return;

    try {
      const slackMessage = {
        text: `Creatorly Alert: ${alert.type}`,
        attachments: [
          {
            color: this.getSeverityColor(alert.severity),
            fields: [
              {
                title: 'Type',
                value: alert.type,
                short: true,
              },
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Message',
                value: alert.message,
                short: false,
              },
              {
                title: 'Time',
                value: alert.timestamp.toISOString(),
                short: true,
              },
            ],
          },
        ],
      };

      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  private getSeverityColor(severity: Alert['severity']): string {
    const colors = {
      low: '#FFA500',
      medium: '#FF6B6B',
      high: '#FF0000',
      critical: '#8B0000',
    };
    return colors[severity];
  }

  public updateMetric(metric: keyof typeof this.metrics, value: number) {
    this.metrics[metric] = value;
  }

  public getAlerts(limit: number = 50): Alert[] {
    return this.alerts.slice(-limit);
  }

  public getAlertStats() {
    const stats = {
      total: this.alerts.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byType: {} as Record<string, number>,
    };

    this.alerts.forEach((alert) => {
      stats.bySeverity[alert.severity]++;
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
let alertsSystemInstance: AlertsSystem | null = null;

export function initializeAlerts(config: AlertConfig): AlertsSystem {
  if (!alertsSystemInstance) {
    alertsSystemInstance = new AlertsSystem(config);
  }
  return alertsSystemInstance;
}

export function getAlertsSystem(): AlertsSystem {
  if (!alertsSystemInstance) {
    throw new Error('Alerts system not initialized. Call initializeAlerts first.');
  }
  return alertsSystemInstance;
}

export default AlertsSystem;
