import { Order } from '@/lib/models/Order';
import { Invoice } from '@/lib/models/Invoice';
import { Payout } from '@/lib/models/Payout';
import mongoose from 'mongoose';

export class BillingService {
    /**
     * Generate an invoice for a successful order
     */
    static async generateInvoiceFromOrder(orderId: string): Promise<any> {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');

        // Check if invoice already exists
        const existing = await Invoice.findOne({ orderId: order._id });
        if (existing) return existing;

        // Generate sequential invoice number (e.g., INV-2026-0001)
        const date = new Date();
        const year = date.getFullYear();
        const count = await Invoice.countDocuments({
            createdAt: {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1)
            }
        });
        const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;

        // Create the invoice
        const invoice = await Invoice.create({
            invoiceNumber,
            creatorId: order.creatorId,
            userId: order.userId,
            orderId: order._id,
            amount: order.total,
            currency: order.currency || 'INR',
            status: order.paymentStatus === 'paid' ? 'paid' : 'issued',
            customerDetails: {
                name: order.customerName,
                email: order.customerEmail,
                address: order.billingAddress
            },
            issuedAt: new Date(),
            paidAt: order.paidAt
        });

        return invoice;
    }

    /**
     * Calculate creator earnings over time
     */
    static async getCreatorEarnings(creatorId: string, range: 'daily' | 'monthly' | 'yearly' = 'monthly') {
        const now = new Date();
        let startDate: Date;

        if (range === 'daily') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); // Last 30 days
        } else if (range === 'monthly') {
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); // Last 12 months
        } else {
            startDate = new Date(now.getFullYear() - 5, 0, 1); // Last 5 years
        }

        const earnings = await Order.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    paymentStatus: 'paid',
                    paidAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: range === 'daily'
                        ? { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } }
                        : range === 'monthly'
                            ? { $dateToString: { format: "%Y-%m", date: "$paidAt" } }
                            : { $dateToString: { format: "%Y", date: "$paidAt" } },
                    total: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        return earnings;
    }

    /**
     * Get billing overview for a creator
     */
    static async getBillingOverview(creatorId: string) {
        const stats = await Order.aggregate([
            { $match: { creatorId: new mongoose.Types.ObjectId(creatorId), paymentStatus: 'paid' } },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$total" },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: "$total" }
                }
            }
        ]);

        const totalPaidOut = await Payout.aggregate([
            { $match: { creatorId: new mongoose.Types.ObjectId(creatorId), status: 'paid' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const overview = stats[0] || { totalEarnings: 0, orderCount: 0, averageOrderValue: 0 };
        const paidOut = totalPaidOut[0]?.total || 0;

        return {
            ...overview,
            totalPaidOut: paidOut,
            currentBalance: overview.totalEarnings - paidOut
        };
    }

    /**
     * Request a payout
     */
    static async requestPayout(creatorId: string, amount: number, notes?: string) {
        const overview = await this.getBillingOverview(creatorId);

        if (amount > overview.currentBalance) {
            throw new Error('Insufficient balance for payout request');
        }

        return await Payout.create({
            creatorId: new mongoose.Types.ObjectId(creatorId),
            amount,
            status: 'pending',
            notes
        });
    }
}
