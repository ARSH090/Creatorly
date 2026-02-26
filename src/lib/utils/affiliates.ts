import { Affiliate, AffiliateClick } from '@/lib/models/Affiliate';
import AffiliateReferral from '@/lib/models/AffiliateReferral';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import mongoose from 'mongoose';

/**
 * Records a click for an affiliate code
 */
export async function trackAffiliateClick(code: string, productId?: string, ip?: string, ua?: string) {
    try {
        const affiliate = await Affiliate.findOne({ affiliateCode: code });
        if (!affiliate || affiliate.status !== 'active') return;

        await AffiliateClick.create({
            affiliateId: affiliate._id,
            productId: productId || affiliate.productId,
            referralCode: code,
            ipAddress: ip,
            userAgent: ua
        });

        await Affiliate.findByIdAndUpdate(affiliate._id, { $inc: { clicks: 1, totalClicks: 1 } });
    } catch (error) {
        console.error('Error tracking affiliate click:', error);
    }
}

/**
 * Attributes an order to an affiliate if a valid code is provided
 */
export async function attributeOrderToAffiliate(orderId: string, affiliateCode: string) {
    try {
        const order = await Order.findById(orderId);
        if (!order || order.paymentStatus !== 'paid') return;

        const affiliate = await Affiliate.findOne({ affiliateCode });
        if (!affiliate || affiliate.status !== 'active') return;

        // Calculate commission
        const commissionAmount = Math.round((order.total * affiliate.commissionPercent) / 100);

        // Create referral record
        await AffiliateReferral.create({
            affiliateId: affiliate._id,
            orderId: order._id,
            creatorId: affiliate.creatorId,
            productId: order.items[0]?.productId, // Simple attribution to first item
            amount: order.total,
            commissionAmount,
            commissionPercent: affiliate.commissionPercent,
            currency: order.currency,
            status: 'pending'
        });

        // Update affiliate stats
        await Affiliate.findByIdAndUpdate(affiliate._id, {
            $inc: {
                conversions: 1,
                totalSales: 1,
                totalCommission: commissionAmount,
                totalEarnings: commissionAmount
            }
        });

        // Link order to affiliate for tracking
        await Order.findByIdAndUpdate(orderId, {
            affiliateId: affiliate._id.toString(),
            commissionAmount
        });

    } catch (error) {
        console.error('Error attributing order to affiliate:', error);
    }
}
