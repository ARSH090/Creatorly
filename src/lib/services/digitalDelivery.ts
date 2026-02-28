import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { DownloadToken } from '@/lib/models/DownloadToken';
import { LicenseKey } from '@/lib/models/LicenseKey';
import { connectToDatabase } from '@/lib/db/mongodb';
import { sendDownloadInstructionsEmail, sendPaymentConfirmationEmail } from './email';
import { RealtimeService } from './realtime';
import crypto from 'crypto';

/**
 * Digital Delivery Service
 * Handles fulfillment of digital products after payment
 */
export class DigitalDeliveryService {
    /**
     * Fulfill a digital order
     */
    static async fulfillOrder(orderId: string) {
        await connectToDatabase();

        const order = await Order.findById(orderId);
        if (!order || order.paymentStatus !== 'paid') {
            console.warn(`[Delivery] Order ${orderId} not found or not paid.`);
            return;
        }

        // Avoid double fulfillment
        if (order.deliveryStatus === 'delivered') {
            console.log(`[Delivery] Order ${order.orderNumber} already delivered.`);
            return;
        }

        console.log(`[Delivery] Fulfilling order ${order.orderNumber} for ${order.customerEmail}`);

        try {
            const deliveryPayload: any = {
                files: [],
                licenseKeys: [],
                courses: []
            };

            for (const item of order.items) {
                const product = await Product.findById(item.productId);
                if (!product) continue;

                // 1. Handle based on product type
                switch (product.productType) {
                    case 'course':
                    case 'membership':
                        await this.grantCourseAccess(order.customerEmail, product);
                        deliveryPayload.courses.push({ name: product.title, id: product._id });
                        break;

                    case 'software':
                        const key = await this.assignLicenseKey(order, product);
                        if (key) deliveryPayload.licenseKeys.push({ name: product.title, key });
                        break;

                    default:
                        // digital_download, ebook, template, etc.
                        const tokens = await this.generateDownloadTokens(order, product);
                        if (tokens.length > 0) {
                            deliveryPayload.files.push({
                                name: product.title,
                                tokens: tokens.map(t => t.token)
                            });
                        }
                        break;
                }

                // 2. Update product stats
                await Product.findByIdAndUpdate(product._id, {
                    $inc: { totalSales: 1, totalRevenue: item.price }
                });
            }

            // 3. Mark Order as Delivered
            order.deliveryStatus = 'delivered';
            order.deliveredAt = new Date();
            await order.save();

            // 4. Send Emails
            // Confirmation to buyer
            await sendPaymentConfirmationEmail(order.customerEmail, order._id.toString(), order.total / 100, order.items);

            // Asset delivery to buyer
            if (deliveryPayload.licenseKeys.length > 0) {
                const { sendLicenseKeyEmail } = await import('./email');
                await sendLicenseKeyEmail(order.customerEmail, order._id.toString(), deliveryPayload.licenseKeys);
            }

            if (deliveryPayload.files.length > 0) {
                await sendDownloadInstructionsEmail(order.customerEmail, order._id.toString(), order.items.map(i => ({ name: i.name, productId: i.productId.toString() })));
            }

            // Notification to Creator
            const creator = await User.findById(order.creatorId);
            if (creator) {
                const { sendCreatorSaleNotificationEmail } = await import('./email');
                // Calculate monthly sales (simplified)
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const monthlyTotal = await Order.aggregate([
                    { $match: { creatorId: creator._id, paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
                    { $group: { _id: null, total: { $sum: "$total" } } }
                ]);

                const productTitle = order.items.map(i => i.name).join(', ');
                await sendCreatorSaleNotificationEmail(
                    creator.email,
                    productTitle,
                    order.total / 100,
                    order.customerEmail,
                    (monthlyTotal[0]?.total || 0) / 100
                );
            }

            // 5. Update Creator Dashboard in Real-time
            await RealtimeService.notifyNewSale(order._id.toString());
            console.log(`[Delivery] Successfully delivered assets and notified creator for ${order.orderNumber}`);

        } catch (error) {
            console.error(`[Delivery] Failed to fulfill order ${order.orderNumber}:`, error);
            order.deliveryStatus = 'failed';
            await order.save();
            throw error;
        }
    }

    /**
     * Grant access to a course
     */
    private static async grantCourseAccess(email: string, product: any) {
        const buyer = await User.findOne({ email: email.toLowerCase() });
        if (!buyer) return;

        const { CourseProgress } = await import('@/lib/models/CourseProgress');

        await CourseProgress.findOneAndUpdate(
            { userId: buyer._id, productId: product._id },
            {
                $setOnInsert: {
                    userId: buyer._id,
                    studentEmail: email.toLowerCase(),
                    productId: product._id,
                    creatorId: product.creatorId,
                    completedLessons: [],
                    isCompleted: false,
                    percentComplete: 0,
                    startedAt: new Date(),
                    lastAccessedAt: new Date()
                }
            },
            { upsert: true }
        );
    }

    /**
     * Generate secure, time-limited download tokens
     */
    private static async generateDownloadTokens(order: any, product: any) {
        if (!product.digitalFileUrl && (!product.files || product.files.length === 0)) return [];

        const tokens = [];
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + (product.downloadExpiryHours || 24));

        // Create a token for each file or the main URL
        const token = await DownloadToken.create({
            token: require('crypto').randomUUID(),
            orderId: order._id,
            productId: product._id,
            userId: order.userId,
            downloadCount: 0,
            maxDownloads: product.downloadLimit || 3,
            expiresAt: expiry,
            isActive: true
        });

        tokens.push(token);
        return tokens;
    }

    /**
     * Assign a license key from the pool
     */
    private static async assignLicenseKey(order: any, product: any) {
        const keyDoc = await LicenseKey.findOneAndUpdate(
            { productId: product._id, isUsed: false },
            {
                isUsed: true,
                orderId: order._id,
                buyerEmail: order.customerEmail,
                assignedAt: new Date()
            },
            { new: true }
        );

        if (!keyDoc) {
            console.error(`[Delivery] NO LICENSE KEYS LEFT for product ${product.title}`);
            // Logic to alert creator could go here
            return null;
        }

        return keyDoc.key;
    }
}
