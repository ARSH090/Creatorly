import Coupon from '@/lib/models/Coupon';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export interface CouponValidationResult {
    valid: boolean;
    discount: number;
    error?: string;
    coupon?: any;
}

/**
 * Validate and calculate discount for a coupon code
 */
export async function validateCoupon(
    code: string,
    orderAmount: number,
    productIds: string[],
    creatorId: string,
    customerEmail?: string
): Promise<CouponValidationResult> {
    try {
        await connectToDatabase();

        // Find coupon
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return { valid: false, discount: 0, error: 'Coupon not found' };
        }

        // Check status
        if (coupon.status !== 'active') {
            return { valid: false, discount: 0, error: 'Coupon is not active' };
        }

        // Check validity dates
        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) {
            return { valid: false, discount: 0, error: 'Coupon not yet valid' };
        }

        if (coupon.validUntil && now > coupon.validUntil) {
            // Auto-expire
            coupon.status = 'expired';
            await coupon.save();
            return { valid: false, discount: 0, error: 'Coupon has expired' };
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return { valid: false, discount: 0, error: 'Coupon usage limit reached' };
        }

        // Check per-user usage (if email provided)
        if (customerEmail && coupon.usagePerUser > 0) {
            const { Order } = await import('@/lib/models/Order');
            const userUsageCount = await Order.countDocuments({
                customerEmail,
                'coupon.code': code.toUpperCase(),
                paymentStatus: 'paid'
            });

            if (userUsageCount >= coupon.usagePerUser) {
                return {
                    valid: false,
                    discount: 0,
                    error: 'You have already used this coupon'
                };
            }
        }

        // Check minimum order amount
        if (orderAmount < coupon.minOrderAmount) {
            return {
                valid: false,
                discount: 0,
                error: `Minimum order amount is ₹${coupon.minOrderAmount}`
            };
        }

        // Check product applicability
        if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
            const hasApplicableProduct = productIds.some(pid =>
                coupon.applicableProducts.some(
                    ap => ap.toString() === pid
                )
            );

            if (!hasApplicableProduct) {
                return {
                    valid: false,
                    discount: 0,
                    error: 'Coupon not applicable to these products'
                };
            }
        }

        // Check creator applicability
        if (coupon.applicableCreators && coupon.applicableCreators.length > 0) {
            const isApplicable = coupon.applicableCreators.some(
                ac => ac.toString() === creatorId
            );

            if (!isApplicable) {
                return {
                    valid: false,
                    discount: 0,
                    error: 'Coupon not applicable to this creator'
                };
            }
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (orderAmount * coupon.discountValue) / 100;

            // Apply max discount cap
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        } else {
            // Fixed amount
            discount = Math.min(coupon.discountValue, orderAmount);
        }

        // Round to 2 decimals
        discount = Math.round(discount * 100) / 100;

        return {
            valid: true,
            discount,
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            }
        };
    } catch (error) {
        console.error('Coupon validation error:', error);
        return {
            valid: false,
            discount: 0,
            error: 'Failed to validate coupon'
        };
    }
}

/**
 * Increment coupon usage count
 */
export async function incrementCouponUsage(couponId: string): Promise<void> {
    try {
        await connectToDatabase();
        await Coupon.findByIdAndUpdate(couponId, {
            $inc: { usedCount: 1 }
        });
    } catch (error) {
        console.error('Failed to increment coupon usage:', error);
    }
}
