import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformSettings extends Document {
  commissionRate: number; // Platform fee percentage (e.g., 10 for 10%)
  payoutThreshold: number; // Minimum amount to trigger payout in rupees
  minProductPrice: number;
  maxProductPrice: number;
  gstRate: number; // GST percentage
  currency: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  featuredCreators: string[]; // Creator IDs on homepage
  supportEmail: string;
  supportPhoneNumber?: string;
  businessName: string;
  businessRegistration: string;
  taxId: string; // PAN or GSTIN
  taxIdType: 'PAN' | 'GSTIN' | 'OTHER';
  paymentMethods: {
    razorpay: { enabled: boolean };
    upi: { enabled: boolean };
    bankTransfer: { enabled: boolean };
    stripe?: { enabled: boolean };
  };
  subscriptionPlans: {
    monthly: { price: number; razorpayPlanId?: string; active: boolean };
    yearly: { price: number; razorpayPlanId?: string; active: boolean };
  };
  emailConfig: {
    from: string;
    replyTo: string;
  };
  stripeWebhookSecret?: string;
  razorpayWebhookSecret?: string;
  maxRefundDays: number; // Days after purchase to allow refunds
  autoPayoutEnabled: boolean;
  autoPayoutDay?: number; // Day of month (1-28)
  suspiciousActivityThreshold: number; // Number of failed logins before account flag
  sessionTimeoutMinutes: number;
  idleTimeoutMinutes: number;
  ipWhitelistEnabled: boolean;
  ipWhitelist?: string[];
  twoFactorAuthRequired: boolean;
  updateLastModifiedBy: string;
  updateLastModifiedAt: Date;
  metadata?: Record<string, any>;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    payoutThreshold: {
      type: Number,
      default: 1000,
    },
    minProductPrice: {
      type: Number,
      default: 100,
    },
    maxProductPrice: {
      type: Number,
      default: 1000000,
    },
    gstRate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: String,
    featuredCreators: [String],
    supportEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    supportPhoneNumber: String,
    businessName: {
      type: String,
      required: true,
    },
    businessRegistration: String,
    taxId: {
      type: String,
      required: true,
    },
    taxIdType: {
      type: String,
      enum: ['PAN', 'GSTIN', 'OTHER'],
      default: 'GSTIN',
    },
    paymentMethods: {
      razorpay: { enabled: { type: Boolean, default: true } },
      upi: { enabled: { type: Boolean, default: true } },
      bankTransfer: { enabled: { type: Boolean, default: true } },
      stripe: { enabled: { type: Boolean, default: false } },
    },
    subscriptionPlans: {
      monthly: {
        price: { type: Number, default: 999 },
        razorpayPlanId: String,
        active: { type: Boolean, default: true }
      },
      yearly: {
        price: { type: Number, default: 9999 },
        razorpayPlanId: String,
        active: { type: Boolean, default: true }
      }
    },
    emailConfig: {
      from: {
        type: String,
        required: true,
        lowercase: true,
      },
      replyTo: {
        type: String,
        required: true,
        lowercase: true,
      },
    },
    stripeWebhookSecret: String,
    razorpayWebhookSecret: String,
    maxRefundDays: {
      type: Number,
      default: 30,
    },
    autoPayoutEnabled: {
      type: Boolean,
      default: false,
    },
    autoPayoutDay: {
      type: Number,
      min: 1,
      max: 28,
    },
    suspiciousActivityThreshold: {
      type: Number,
      default: 5,
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 120,
    },
    idleTimeoutMinutes: {
      type: Number,
      default: 15,
    },
    ipWhitelistEnabled: {
      type: Boolean,
      default: false,
    },
    ipWhitelist: [String],
    twoFactorAuthRequired: {
      type: Boolean,
      default: true,
    },
    updateLastModifiedBy: {
      type: String,
      required: true,
    },
    updateLastModifiedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.models.PlatformSettings || mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);
