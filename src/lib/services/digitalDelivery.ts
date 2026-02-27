import { Order } from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { getPresignedDownloadUrl } from '@/lib/storage/s3';
import { connectToDatabase } from '@/lib/db/mongodb';

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
        const order = await Order.findById(orderId).populate('items.productId');
        if (!order || order.paymentStatus !== 'paid') return;

        // 1. Process each item in the order
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            // Handle based on product type
            if (product.productType === 'course') {
                await this.grantCourseAccess(order.customerEmail, product);
            } else {
                await this.prepareDigitalDownloads(order, product);
            }

            // 2. Update stats for the product
            await Product.findByIdAndUpdate(product._id, {
                $inc: { totalSales: 1, totalRevenue: item.price }
            });
        }

        // 3. Send Delivery Email (Placeholder for actual email service)
        console.log(`[Delivery] Sending assets to ${order.customerEmail} for order ${order.orderNumber}`);
    }

    /**
     * Grant access to a course
     */
    private static async grantCourseAccess(email: string, product: any) {
        console.log(`[Delivery] Granting course access: ${product.title} to ${email}`);

        const buyer = await User.findOne({ email: email.toLowerCase() });
        if (!buyer) {
            console.log(`[Delivery] Buyer not found for ${email}`);
            return;
        }

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
            { upsert: true, new: true }
        );
    }

    /**
     * Prepare download links for ebooks/templates/etc.
     */
    private static async prepareDigitalDownloads(order: any, product: any) {
        if (!product.files || product.files.length === 0) return;

        const downloadLinks = await Promise.all(
            product.files.map(async (file: any) => {
                const url = await getPresignedDownloadUrl(file.key, 72 * 3600); // 72 hours
                return { name: file.name, url };
            })
        );

        // Store these links in the order metadata or a temporary delivery table
        order.metadata = {
            ...order.metadata,
            downloadLinks
        };
        await order.save();
    }
}
