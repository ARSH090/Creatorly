import { connectToDatabase } from '@/lib/db/mongodb';
import AbandonedCheckout from '@/lib/models/AbandonedCheckout';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';

interface RecoveryEmailData {
    checkoutId: string;
    buyerEmail: string;
    buyerName?: string;
    product: any;
    creator: any;
    couponCode: string;
    recoveryNumber: number;
}

class AbandonedCheckoutRecovery {
    private static instance: AbandonedCheckoutRecovery;

    public static getInstance(): AbandonedCheckoutRecovery {
        if (!AbandonedCheckoutRecovery.instance) {
            AbandonedCheckoutRecovery.instance = new AbandonedCheckoutRecovery();
        }
        return AbandonedCheckoutRecovery.instance;
    }

    /**
     * Send first recovery email (1 hour after abandonment)
     */
    async sendFirstRecoveryEmail(checkoutId: string): Promise<boolean> {
        try {
            await connectToDatabase();

            const checkout = await AbandonedCheckout.findById(checkoutId)
                .populate('productId')
                .populate('creatorId');

            if (!checkout || checkout.status !== 'abandoned' || checkout.recoveryEmail1SentAt) {
                return false;
            }

            const product = checkout.productId as any;
            const creator = checkout.creatorId as any;

            // Generate one-time recovery coupon
            const couponCode = this.generateRecoveryCoupon(creator.displayName);

            const emailData: RecoveryEmailData = {
                checkoutId: checkout._id.toString(),
                buyerEmail: checkout.buyerEmail,
                buyerName: checkout.buyerName,
                product,
                creator,
                couponCode,
                recoveryNumber: 1
            };

            await this.sendRecoveryEmail(emailData);

            // Update checkout record
            await AbandonedCheckout.findByIdAndUpdate(checkoutId, {
                recoveryEmail1SentAt: new Date(),
                $push: { recoveryAttempts: { type: 'email1', sentAt: new Date() } }
            });

            return true;
        } catch (error) {
            console.error('First recovery email failed:', error);
            return false;
        }
    }

    /**
     * Send second recovery email (24 hours after abandonment)
     */
    async sendSecondRecoveryEmail(checkoutId: string): Promise<boolean> {
        try {
            await connectToDatabase();

            const checkout = await AbandonedCheckout.findById(checkoutId)
                .populate('productId')
                .populate('creatorId');

            if (!checkout || checkout.status !== 'abandoned' ||
                checkout.recoveryEmail2SentAt || !checkout.recoveryEmail1SentAt) {
                return false;
            }

            const product = checkout.productId as any;
            const creator = checkout.creatorId as any;

            // Generate higher discount coupon for second recovery
            const couponCode = this.generateRecoveryCoupon(creator.displayName, true);

            const emailData: RecoveryEmailData = {
                checkoutId: checkout._id.toString(),
                buyerEmail: checkout.buyerEmail,
                buyerName: checkout.buyerName,
                product,
                creator,
                couponCode,
                recoveryNumber: 2
            };

            await this.sendRecoveryEmail(emailData, true);

            // Update checkout record
            await AbandonedCheckout.findByIdAndUpdate(checkoutId, {
                recoveryEmail2SentAt: new Date(),
                $push: { recoveryAttempts: { type: 'email2', sentAt: new Date() } }
            });

            return true;
        } catch (error) {
            console.error('Second recovery email failed:', error);
            return false;
        }
    }

    /**
     * Generate recovery coupon code
     */
    private generateRecoveryCoupon(creatorName: string | undefined, isSecondEmail: boolean = false): string {
        const prefix = (creatorName || 'COME').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
        const discount = isSecondEmail ? '25' : '15';
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}BACK${discount}${random}`;
    }

    /**
     * Send recovery email
     */
    private async sendRecoveryEmail(data: RecoveryEmailData, isSecondEmail: boolean = false): Promise<void> {
        const { buyerEmail, buyerName, product, creator, couponCode, recoveryNumber } = data;

        const subject = isSecondEmail
            ? `Still thinking about ${product.title}? Here's 25% off!`
            : `Complete your purchase of ${product.title}`;

        const discount = isSecondEmail ? '25%' : '15%';

        const emailHtml = this.generateRecoveryEmailTemplate({
            buyerName,
            productTitle: product.title,
            creatorName: creator.displayName,
            productImage: product.coverImageUrl || undefined,
            originalPrice: product.pricing?.basePrice || product.price || 0,
            discount,
            couponCode,
            recoveryNumber,
            isSecondEmail,
            checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${product._id}?email=${encodeURIComponent(buyerEmail)}&coupon=${couponCode}`
        });

        const { sendEmail } = await import('./email');
        await sendEmail({
            to: buyerEmail,
            subject,
            html: emailHtml,
        });
    }

    /**
     * Generate recovery email template
     */
    private generateRecoveryEmailTemplate(data: {
        buyerName?: string;
        productTitle: string;
        creatorName: string;
        productImage?: string;
        originalPrice: number;
        discount: string;
        couponCode: string;
        recoveryNumber: number;
        isSecondEmail: boolean;
        checkoutUrl: string;
    }): string {
        const {
            buyerName,
            productTitle,
            creatorName,
            productImage,
            originalPrice,
            discount,
            couponCode,
            checkoutUrl
        } = data;

        const discountedPrice = data.isSecondEmail
            ? originalPrice * 0.75
            : originalPrice * 0.85;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Your Purchase</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 0; }
        .product-card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .product-image { width: 100%; max-width: 300px; border-radius: 8px; margin: 0 auto; display: block; }
        .price-section { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 20px 0; }
        .original-price { text-decoration: line-through; color: #666; font-size: 18px; }
        .discounted-price { color: #10b981; font-size: 24px; font-weight: bold; }
        .coupon-badge { background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 15px 0; }
        .cta-button { background: #6366f1; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${data.isSecondEmail ? 'Still Interested?' : 'Complete Your Purchase'}</h1>
            <p>${buyerName ? `Hi ${buyerName},` : 'Hi there,'}</p>
        </div>

        <div class="product-card">
            ${productImage ? `<img src="${productImage}" alt="${productTitle}" class="product-image">` : ''}
            <h2>${productTitle}</h2>
            <p>by ${creatorName}</p>
            
            <div class="price-section">
                <span class="original-price">₹${originalPrice}</span>
                <span class="discounted-price">₹${Math.round(discountedPrice)}</span>
            </div>
            
            <div style="text-align: center;">
                <div class="coupon-badge">
                    🎁 Use code: ${couponCode} for ${discount} off
                </div>
                
                <a href="${checkoutUrl}" class="cta-button">
                    Complete Purchase Now
                </a>
                
                <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    ${data.isSecondEmail
                ? 'This is your final reminder - the offer expires in 24 hours!'
                : 'This special offer expires in 48 hours.'
            }
                </p>
            </div>
        </div>

        <div class="footer">
            <p>Questions? Reply to this email or contact ${creatorName}</p>
            <p>Created with ❤️ on Creatorly</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Process all pending recovery emails
     */
    async processPendingRecoveries(): Promise<void> {
        try {
            await connectToDatabase();

            const now = new Date();

            // Send first recovery emails (1 hour after abandonment)
            const firstRecoveryCheckouts = await AbandonedCheckout.find({
                status: 'abandoned',
                recoveryEmail1SentAt: { $exists: false },
                capturedAt: { $lte: new Date(now.getTime() - 60 * 60 * 1000) } // 1 hour ago
            }).limit(50);

            for (const checkout of firstRecoveryCheckouts) {
                await this.sendFirstRecoveryEmail(checkout._id.toString());
            }

            // Send second recovery emails (24 hours after abandonment)
            const secondRecoveryCheckouts = await AbandonedCheckout.find({
                status: 'abandoned',
                recoveryEmail1SentAt: { $exists: true },
                recoveryEmail2SentAt: { $exists: false },
                capturedAt: { $lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } // 24 hours ago
            }).limit(50);

            for (const checkout of secondRecoveryCheckouts) {
                await this.sendSecondRecoveryEmail(checkout._id.toString());
            }

            console.log(`Processed ${firstRecoveryCheckouts.length} first recovery emails and ${secondRecoveryCheckouts.length} second recovery emails`);
        } catch (error) {
            console.error('Error processing pending recoveries:', error);
        }
    }

    /**
     * Mark checkout as recovered
     */
    async markAsRecovered(checkoutId: string, orderId: string): Promise<void> {
        try {
            await connectToDatabase();

            await AbandonedCheckout.findByIdAndUpdate(checkoutId, {
                status: 'recovered',
                recoveredAt: new Date(),
                recoveredOrderId: orderId,
                recoveryEnded: true
            });
        } catch (error) {
            console.error('Error marking checkout as recovered:', error);
        }
    }

    /**
     * Get recovery analytics
     */
    async getRecoveryAnalytics(creatorId: string, timeframe: string = '30d'): Promise<any> {
        try {
            await connectToDatabase();

            const now = new Date();
            let startDate = new Date();

            switch (timeframe) {
                case '7d':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(now.getDate() - 90);
                    break;
                default:
                    startDate.setDate(now.getDate() - 30);
            }

            const analytics = await AbandonedCheckout.aggregate([
                {
                    $match: {
                        creatorId,
                        capturedAt: { $gte: startDate, $lte: now }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$productPrice' }
                    }
                }
            ]);

            const totalAbandoned = analytics.find(a => a._id === 'abandoned')?.count || 0;
            const totalRecovered = analytics.find(a => a._id === 'recovered')?.count || 0;
            const totalValue = analytics.find(a => a._id === 'recovered')?.totalValue || 0;

            const recoveryRate = totalAbandoned > 0 ? (totalRecovered / totalAbandoned) * 100 : 0;

            return {
                timeframe,
                totalAbandoned,
                totalRecovered,
                recoveryRate: Math.round(recoveryRate * 100) / 100,
                totalRecoveredValue: totalValue,
                dateRange: { start: startDate, end: now }
            };
        } catch (error) {
            console.error('Error getting recovery analytics:', error);
            return null;
        }
    }
}

export default AbandonedCheckoutRecovery.getInstance();
