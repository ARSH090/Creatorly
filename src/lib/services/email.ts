import { sendEmail as sendGenericEmail } from '../email/client';
import { welcomeEmail } from '../email/templates/welcome';
import { purchaseConfirmationEmail } from '../email/templates/purchase-confirmation';
import { saleNotificationEmail } from '../email/templates/sale-notification';
import { trialWarningEmail } from '../email/templates/trial-warning';
import { trialExpiredEmail } from '../email/templates/trial-expired';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Re-export the generic sendEmail for backward compatibility
 */
export async function sendEmail(options: EmailOptions) {
  return sendGenericEmail(options);
}

/**
 * Send a welcome email using the new template
 */
export async function sendWelcomeEmail(email: string, displayName: string = 'there') {
  const { subject, html } = welcomeEmail({ name: displayName, username: 'creator' });
  return sendGenericEmail({ to: email, subject, html });
}

/**
 * Send payment confirmation to buyer
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  orderId: string,
  amount: number,
  items: Array<{ name: string; quantity: number; price: number }>,
  downloadUrl?: string
) {
  const productName = items.map(i => i.name).join(', ');
  const { subject, html } = purchaseConfirmationEmail({
    buyerName: 'Valued Customer',
    productName,
    creatorName: 'Creatorly Seller',
    amount: amount * 100, // template expects paise
    downloadUrl
  });
  return sendGenericEmail({ to: email, subject, html });
}

/**
 * Send sale notification to creator
 */
export async function sendCreatorSaleNotificationEmail(
  email: string,
  productName: string,
  amount: number,
  buyerEmail: string,
  _monthlySales?: number // keeping param for compat
) {
  const { subject, html } = saleNotificationEmail({
    creatorName: 'Creator',
    productName,
    buyerEmail,
    amount: amount * 100 // template expects paise
  });
  return sendGenericEmail({ to: email, subject, html });
}

/**
 * Send trial reminder
 */
export async function sendTrialReminderEmail(
  email: string,
  opts: { daysLeft: number; name?: string; plan?: string }
) {
  const { daysLeft, name = 'there', plan = 'Pro' } = opts;
  const { subject, html } = trialWarningEmail({ name, daysLeft, plan });
  return sendGenericEmail({ to: email, subject, html });
}

/**
 * Send trial expired notification
 */
export async function sendTrialExpiredEmail(
  email: string,
  opts: { name?: string; plan?: string }
) {
  const { name = 'there', plan = 'Pro' } = opts;
  const { subject, html } = trialExpiredEmail({ name, plan });
  return sendGenericEmail({ to: email, subject, html });
}

/**
 * Send download instructions to buyer after purchase
 */
export async function sendDownloadInstructionsEmail(
  email: string,
  orderId: string,
  items: Array<{ name: string; productId: string }>
) {
  const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in'}/orders/${orderId}/downloads`;
  const itemList = items.map(i => `<li>${i.name}</li>`).join('');
  const html = `
    <h2>Your Download is Ready!</h2>
    <p>Thank you for your purchase. Your files are ready to download:</p>
    <ul>${itemList}</ul>
    <p><a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Download Now</a></p>
    <p style="color:#888;font-size:12px;">This link will expire in 24 hours. If you need assistance, reply to this email.</p>
  `;
  return sendGenericEmail({ to: email, subject: `Your downloads are ready — Order #${orderId.slice(-6).toUpperCase()}`, html });
}

/**
 * Send license key(s) to buyer after purchase
 */
export async function sendLicenseKeyEmail(
  email: string,
  orderId: string,
  licenseKeys: Array<{ name: string; key: string }>
) {
  const keyRows = licenseKeys.map(lk =>
    `<tr><td style="padding:8px;border:1px solid #eee;">${lk.name}</td><td style="padding:8px;border:1px solid #eee;font-family:monospace;">${lk.key}</td></tr>`
  ).join('');
  const html = `
    <h2>Your License Key${licenseKeys.length > 1 ? 's' : ''}</h2>
    <p>Here ${licenseKeys.length > 1 ? 'are your license keys' : 'is your license key'} for Order #${orderId.slice(-6).toUpperCase()}:</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0;">
      <tr style="background:#f5f5f5;"><th style="padding:8px;border:1px solid #eee;text-align:left;">Product</th><th style="padding:8px;border:1px solid #eee;text-align:left;">License Key</th></tr>
      ${keyRows}
    </table>
    <p style="color:#888;font-size:12px;">Keep this email safe. If you need assistance, reply to this email.</p>
  `;
  return sendGenericEmail({ to: email, subject: `Your License Key — Order #${orderId.slice(-6).toUpperCase()}`, html });
}

/**
 * Send affiliate commission notification
 */
export async function sendAffiliateNotificationEmail(
  email: string,
  affiliateCode: string,
  commissionAmount: number,
  orderId: string
) {
  const html = `
    <h2>🎉 You Earned a Commission!</h2>
    <p>Great news! A sale was made through your affiliate link <strong>${affiliateCode}</strong>.</p>
    <p><strong>Commission earned:</strong> ₹${(commissionAmount / 100).toFixed(2)}</p>
    <p><strong>Order:</strong> #${orderId.slice(-6).toUpperCase()}</p>
    <p>Your earnings will be credited to your account balance.</p>
    <p style="color:#888;font-size:12px;">Keep sharing your link to earn more!</p>
  `;
  return sendGenericEmail({ to: email, subject: `Affiliate Commission Earned — ₹${(commissionAmount / 100).toFixed(2)}`, html });
}

/**
 * Verification Email (Legacy/Generic)
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in'}/auth/verify-email?token=${token}`;
  const html = `<p>Please verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`;
  return sendGenericEmail({ to: email, subject: 'Verify Your Creatorly Email', html });
}

/**
 * Send usage warning when approaching plan limits
 */
export async function sendUsageWarningEmail(
  email: string,
  opts: { feature: string; used: number; limit: number; name?: string }
) {
  const { feature, used, limit, name = 'there' } = opts;
  const percent = Math.round((used / limit) * 100);
  const html = `
    <h2>⚠️ Usage Alert</h2>
    <p>Hi ${name},</p>
    <p>You've used <strong>${percent}%</strong> of your <strong>${feature}</strong> limit (${used}/${limit}).</p>
    <p>Upgrade your plan to avoid interruptions.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in'}/pricing" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Upgrade Now</a></p>
  `;
  return sendGenericEmail({ to: email, subject: `Usage Alert: ${feature} at ${percent}%`, html });
}

/**
 * Send marketing/campaign email to a subscriber
 */
export async function sendMarketingEmail(
  email: string,
  opts: { subject: string; html: string; replyTo?: string }
) {
  return sendGenericEmail({
    to: email,
    subject: opts.subject,
    html: opts.html
  });
}

/**
 * Send newsletter welcome email to new subscribers
 */
export async function sendNewsletterWelcomeEmail(
  email: string,
  opts: { creatorName?: string; leadMagnetUrl?: string }
) {
  const { creatorName = 'a Creatorly creator', leadMagnetUrl } = opts;
  const downloadBlock = leadMagnetUrl
    ? `<p><a href="${leadMagnetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Download Your Freebie</a></p>`
    : '';
  const html = `
    <h2>Welcome! 🎉</h2>
    <p>Thanks for subscribing to <strong>${creatorName}</strong>'s list.</p>
    ${downloadBlock}
    <p style="color:#888;font-size:12px;">You can unsubscribe at any time by clicking the link at the bottom of future emails.</p>
  `;
  return sendGenericEmail({ to: email, subject: `Welcome from ${creatorName}!`, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in'}/auth/reset-password?token=${token}`;
  const html = `
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to set a new one:</p>
    <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
    <p style="color:#888;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
  `;
  return sendGenericEmail({ to: email, subject: 'Reset Your Creatorly Password', html });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  email: string,
  opts: { productName: string; date: string; time: string; duration: number }
) {
  const { productName, date, time, duration } = opts;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Booking Confirmed! ✅</h2>
        <p>Your booking for <strong>${productName}</strong> is confirmed.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
        </div>
        <p>The creator will provide the meeting link separately at the time of the event if it hasn't been provided already.</p>
        <p style="color:#888;font-size:12px; margin-top: 30px;">Thank you for your booking through Creatorly.</p>
    </div>
  `;
  return sendGenericEmail({ to: email, subject: `Booking Confirmed: ${productName}`, html });
}
