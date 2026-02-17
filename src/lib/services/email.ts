import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    if (!resend) {
      console.warn('Email service not configured (RESEND_API_KEY not set)');
      return { success: false, error: 'Email service not configured' };
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@creatorly.app',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { color: #333; margin-bottom: 20px; }
          .button { background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">Verify Your Email</h1>
          <p>Welcome to Creatorly! Please verify your email address to get started.</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy this link: <br/> ${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create this account, please ignore this email.</p>
            <p>&copy; 2026 Creatorly. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Creatorly Email',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          .header { color: #333; margin-bottom: 20px; }
          .button { background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          .warning { background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">Reset Your Password</h1>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy this link: <br/> ${resetUrl}</p>
          <div class="warning">
            <strong>Security Notice:</strong> This link expires in 1 hour. If you didn't request this, please ignore this email.
          </div>
          <div class="footer">
            <p>&copy; 2026 Creatorly. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Creatorly Password',
    html,
  });
}

export async function sendWelcomeEmail(email: string, displayName: string = 'there') {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #030303; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin:20px auto; background: #0a0a0a; border: 1px solid #333; border-radius: 24px; padding: 40px; }
          .header { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; font-style: italic; margin-bottom: 16px; text-align: center; }
          .subheader { color: #888; font-size: 16px; text-align: center; margin-bottom: 40px; }
          .card { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; padding: 30px; margin-bottom: 24px; text-align: center; }
          .button { display: block; background: #fff; color: #000; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; margin-top: 30px; }
          .footer { text-align: center; font-size: 10px; color: #444; margin-top: 40px; text-transform: uppercase; letter-spacing: 0.2em; }
          .feature { background: #111; border-radius: 12px; padding: 16px; margin: 12px 0; text-align: left; }
          .feature-title { font-weight: 700; color: #6366f1; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div style="font-size: 64px; margin-bottom: 16px;">🚀</div>
            <div class="header" style="color: #fff;">WELCOME TO CREATORLY</div>
            <p style="font-size: 16px; opacity: 0.9; margin: 0;">Your creator journey starts now, ${displayName}!</p>
          </div>
          
          <p class="subheader">You've just joined the next-generation platform for creators.</p>
          
          <div class="feature">
            <div class="feature-title">📦 Sell Digital Products</div>
            <p style="color: #888; font-size: 14px; margin: 4px 0 0;">Launch courses, ebooks, templates, and more</p>
          </div>
          
          <div class="feature">
            <div class="feature-title">🎯 Build Your Community</div>
            <p style="color: #888; font-size: 14px; margin: 4px 0 0;">Engage your biggest fans with exclusive content</p>
          </div>
          
          <div class="feature">
            <div class="feature-title">💰 Get Paid Instantly</div>
            <p style="color: #888; font-size: 14px; margin: 4px 0 0;">Secure payments with low platform fees</p>
          </div>

          <a href="${process.env.NEXTAUTH_URL || 'https://creatorly.in'}/dashboard" class="button">SET UP MY STORE</a>

          <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
            Need help getting started? Reply to this email anytime.
          </p>

          <div class="footer">
            &copy; 2026 CREATORLY • BUILT BY CREATORS, FOR CREATORS
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🚀 Welcome to Creatorly – Let's Build Something Amazing!',
    html,
  });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  orderId: string,
  amount: number,
  items: Array<{ name: string; quantity: number; price: number }>
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #030303; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #0a0a0a; border: 1px solid #333; border-radius: 24px; padding: 40px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .header { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; font-style: italic; margin-bottom: 8px; text-align: center; }
          .subheader { color: #888; font-size: 14px; text-align: center; margin-bottom: 40px; }
          .order-card { background: #111; border: 1px solid #222; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .item-name { font-weight: 700; color: #fff; }
          .item-price { color: #888; font-family: monospace; }
          .divider { border-top: 1px solid #222; margin: 20px 0; }
          .total { display: flex; justify-content: space-between; font-weight: 900; font-size: 18px; color: #6366f1; }
          .button { display: block; background: #fff; color: #000; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; margin-top: 30px; }
          .footer { text-align: center; font-size: 10px; color: #444; margin-top: 40px; text-transform: uppercase; letter-spacing: 0.2em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">ORDER CONFIRMED</div>
          <p class="subheader">Thank you for supporting a creator on Creatorly.</p>
          
          <div class="order-card">
            <p style="font-size: 10px; font-weight: 900; color: #444; margin-bottom: 16px; text-transform: uppercase;">Receipt for Order #${orderId}</p>
            ${items.map(item => `
              <div class="item">
                <span class="item-name">${item.name} x ${item.quantity}</span>
                <span class="item-price">₹${item.price.toLocaleString()}</span>
              </div>
            `).join('')}
            <div class="divider"></div>
            <div class="total">
              <span>TOTAL (INCL. GST)</span>
              <span>₹${amount.toLocaleString()}</span>
            </div>
          </div>

          <a href="${process.env.NEXTAUTH_URL}/account/downloads" class="button">Access My Library</a>

          <div class="footer">
            &copy; 2026 CREATORLY • SHIPPED WITH ANTI-GRAVITY TECH
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Receipt: Order #${orderId.slice(-6)} confirmed!`,
    html,
  });
}

export async function sendDownloadInstructionsEmail(
  email: string,
  orderId: string,
  items: Array<{ name: string; productId: string }>
) {
  // In a real app, we'd generate individual tokens here, 
  // but for simplicity we lead them to the secure dashboard.
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #030303; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #0a0a0a; border: 1px solid #333; border-radius: 24px; padding: 40px; }
          .header { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; font-style: italic; margin-bottom: 8px; text-align: center; }
          .card { background: #6366f1; border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #fff; text-align: center; }
          .item-list { background: #111; border-radius: 16px; padding: 20px; text-align: left; }
          .item-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          .dot { width: 8px; h-eight: 8px; background: #6366f1; border-radius: 50%; }
          .button { display: block; background: #fff; color: #000; text-align: center; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; margin-top: 30px; }
          .footer { text-align: center; font-size: 10px; color: #444; margin-top: 40px; text-transform: uppercase; letter-spacing: 0.2em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
            <div class="header" style="color: #fff;">GET YOUR ASSETS</div>
            <p style="font-size: 14px; opacity: 0.8;">Your digital content is ready for liftoff.</p>
          </div>
          
          <div class="item-list">
             <p style="font-size: 10px; font-weight: 900; color: #444; margin-bottom: 16px; text-transform: uppercase;">Included in this delivery:</p>
             ${items.map(item => `
               <div class="item-row">
                 <div class="dot"></div>
                 <span style="font-size: 14px; font-weight: 700;">${item.name}</span>
               </div>
             `).join('')}
          </div>

          <a href="${process.env.NEXTAUTH_URL}/account/downloads" class="button">Download Now</a>

          <p style="font-size: 12px; color: #666; text-align: center; margin-top: 24px;">
            Link valid for 24 hours. Need help? Reply to this email.
          </p>

          <div class="footer">
            &copy; 2026 CREATORLY • DIGITAL FLOW ACTIVATED
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your downloads are ready! (Order #${orderId.slice(-6)})`,
    html,
  });
}

export async function sendNewsletterWelcomeEmail(email: string, creatorName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #030303; color: #ffffff; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: #0a0a0a; border: 1px solid #333; border-radius: 24px; padding: 40px; text-align: center; }
          .header { font-size: 24px; font-weight: 900; text-transform: uppercase; font-style: italic; margin-bottom: 16px; }
          .content { color: #888; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .btn { display: inline-block; background: #6366f1; color: #fff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">WELCOME TO THE INNER CIRCLE</div>
          <div class="content">
            <p>You've successfully subscribed to <strong>${creatorName}'s</strong> newsletter on Creatorly.</p>
            <p>Stay tuned for exclusive updates, early access to new products, and behind-the-scenes content.</p>
          </div>
          <a href="${process.env.NEXTAUTH_URL}/u/${creatorName.toLowerCase()}" class="btn">Visit My Store</a>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${creatorName}'s Newsletter!`,
    html
  });
}

export async function sendPaymentFailureEmail(email: string, orderId: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fff; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #e11d48;">Payment Failed</h2>
      <p>We're sorry, but your payment for order <strong>#${orderId.slice(-6)}</strong> could not be processed.</p>
      <p>This could be due to insufficient funds, an expired card, or a temporary issue with your bank.</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/checkout/retry?orderId=${orderId}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Retry Payment</a>
      </div>
      <p style="font-size: 12px; color: #666;">If you have any questions, please contact our support team.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Action Required: Payment Failed for Order #${orderId.slice(-6)}`,
    html
  });
}

export async function sendUsageWarningEmail(email: string, resource: string, percentage: number) {
  const isLimit = percentage >= 100;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fff; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: ${isLimit ? '#e11d48' : '#f59e0b'};">${isLimit ? 'Limit Reached' : 'Usage Warning'}</h2>
      <p>You have used <strong>${percentage}%</strong> of your monthly ${resource} allowance.</p>
      <p>${isLimit ? 'You have reached your limit. Please upgrade to continue using this service.' : 'You are approaching your limit. Consider upgrading to avoid any interruptions.'}</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/billing" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Upgrade Plan</a>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `${isLimit ? 'Critical' : 'Alert'}: ${resource} Usage at ${percentage}%`,
    html
  });
}

export async function sendAffiliateNotificationEmail(
  email: string,
  affiliateCode: string,
  commissionAmount: number,
  orderId: string
) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fff; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #10b981;">Cha-ching! New Commission 💰</h2>
      <p>Great news! You just earned a commission from a referral.</p>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Affiliate Code</p>
        <p style="margin: 5px 0 15px 0; font-weight: bold; font-size: 18px;">${affiliateCode}</p>
        
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Commission Earned</p>
        <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 24px; color: #10b981;">₹${commissionAmount.toFixed(2)}</p>
      </div>

      <p style="font-size: 14px; color: #6b7280;">Order Reference: #${orderId.slice(-6)}</p>
      
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/affiliates" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `You earned ₹${commissionAmount} commission!`,
    html
  });
}

