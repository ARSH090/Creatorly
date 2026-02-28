import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { errorResponse } from '@/types/api';

/**
 * POST /api/checkout/upi/create-intent
 * Generate UPI payment link/QR parameters
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { productId, customerEmail, customPrice } = await req.json();

        const product = await Product.findById(productId);
        if (!product) return NextResponse.json(errorResponse('Product not found'), { status: 404 });

        const creator = await User.findById(product.creatorId);
        const upiConfig = creator?.paymentConfigs?.upi;

        if (!upiConfig?.active || !upiConfig?.upiId) {
            return NextResponse.json(errorResponse('UPI not enabled by creator'), { status: 400 });
        }

        // Determine price
        let amount = product.pricing?.salePrice || product.pricing?.basePrice || product.price || 0;
        if (product.pricingType === 'pwyw' && customPrice) amount = customPrice;

        // Generate UPI URI
        // upi://pay?pa=upiId&pn=DisplayName&am=Amount&cu=INR&tn=OrderId
        const orderId = `ord_${Math.random().toString(36).substring(2, 10)}`;
        const upiUri = `upi://pay?pa=${upiConfig.upiId}&pn=${encodeURIComponent(creator?.displayName ?? '')}&am=${amount}&cu=INR&tn=${encodeURIComponent(product.title.slice(0, 20))}`;

        return NextResponse.json({
            success: true,
            upiUri,
            upiId: upiConfig.upiId,
            amount,
            orderId,
            qrData: upiUri, // Frontend can use this for QR
            creatorName: creator?.displayName
        });

    } catch (error: any) {
        return NextResponse.json(errorResponse(error.message), { status: 500 });
    }
}
