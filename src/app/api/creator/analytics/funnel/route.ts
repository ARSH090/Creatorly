import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import mongoose from 'mongoose';

async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const match: any = {
        creatorId: new mongoose.Types.ObjectId(user._id),
        createdAt: { $gte: startDate }
    };

    if (productId) {
        // Individual Product Funnel
        const views = await AnalyticsEvent.countDocuments({ ...match, productId, eventType: 'product_view' });
        const checkouts = await AnalyticsEvent.countDocuments({ ...match, productId, eventType: 'checkout_start' });
        const purchases = await Order.countDocuments({
            creatorId: user._id,
            'items.productId': productId,
            status: 'completed',
            createdAt: { $gte: startDate }
        });

        return NextResponse.json({
            type: 'product',
            productId,
            funnel: [
                { stage: 'Views', count: views },
                { stage: 'Checkouts', count: checkouts },
                { stage: 'Purchases', count: purchases }
            ],
            rates: {
                viewToCheckout: views > 0 ? Math.round((checkouts / views) * 100) : 0,
                checkoutToPurchase: checkouts > 0 ? Math.round((purchases / checkouts) * 100) : 0,
                overall: views > 0 ? Math.round((purchases / views) * 100) : 0
            }
        });
    } else {
        // Global Storefront Funnel
        const storeVisits = await AnalyticsEvent.countDocuments({ ...match, eventType: 'page_view' });
        const productViews = await AnalyticsEvent.countDocuments({ ...match, eventType: 'product_view' });
        const checkouts = await AnalyticsEvent.countDocuments({ ...match, eventType: 'checkout_start' });
        const purchases = await Order.countDocuments({
            creatorId: user._id,
            status: 'completed',
            createdAt: { $gte: startDate }
        });

        return NextResponse.json({
            type: 'global',
            funnel: [
                { stage: 'Storefront Visits', count: storeVisits },
                { stage: 'Product Views', count: productViews },
                { stage: 'Checkouts', count: checkouts },
                { stage: 'Purchases', count: purchases }
            ],
            rates: {
                visitToView: storeVisits > 0 ? Math.round((productViews / storeVisits) * 100) : 0,
                viewToCheckout: productViews > 0 ? Math.round((checkouts / productViews) * 100) : 0,
                checkoutToPurchase: checkouts > 0 ? Math.round((purchases / checkouts) * 100) : 0,
                overall: storeVisits > 0 ? Math.round((purchases / storeVisits) * 100) : 0
            }
        });
    }
}

export const GET = withCreatorAuth(withErrorHandler(handler));
