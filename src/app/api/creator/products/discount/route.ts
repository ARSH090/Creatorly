import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler, throwError } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * POST /api/creator/products/discount
 * Add discount code to a product
 * Body: { productId, code, percentage?, fixedAmount?, validUntil?, maxUses? }
 */
async function postHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'discountCodes')) {
        throwError.featureNotAvailable('discount codes', 'Creator Pro');
    }

    const body = await req.json();
    const { productId, code, percentage, fixedAmount, validUntil, maxUses } = body;

    if (!productId || !code) {
        throwError.badRequest('productId and code are required');
    }

    if (!percentage && !fixedAmount) {
        throwError.badRequest('Either percentage or fixedAmount must be provided');
    }

    const product = await Product.findOne({ _id: productId, creatorId: user._id });

    if (!product) {
        throwError.notFound('Product');
    }

    // Check if code already exists
    const existingCode = (product as any).discountCodes?.find(
        (dc: any) => dc.code.toUpperCase() === code.toUpperCase()
    );

    if (existingCode) {
        throwError.badRequest('Discount code already exists for this product');
    }

    // Add discount code
    const discountCode = {
        code: code.toUpperCase(),
        percentage: percentage || 0,
        fixedAmount: fixedAmount || 0,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        maxUses: maxUses || undefined,
        uses: 0
    };

    (product as any).discountCodes = (product as any).discountCodes || [];
    (product as any).discountCodes.push(discountCode);
    await (product as any).save();

    return {
        success: true,
        discountCode,
        message: 'Discount code added successfully'
    };
}

/**
 * GET /api/creator/products/discount
 * List all discount codes across all products
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const products = await Product.find({
        creatorId: user._id,
        'discountCodes.0': { $exists: true }
    }).select('name discountCodes');

    const allCodes = products.flatMap(p =>
        (p.discountCodes || []).map((dc: any) => ({
            productId: p._id,
            productName: p.name,
            code: dc.code,
            percentage: dc.percentage,
            fixedAmount: dc.fixedAmount,
            validUntil: dc.validUntil,
            maxUses: dc.maxUses,
            uses: dc.uses,
            isActive: !dc.validUntil || new Date(dc.validUntil) > new Date()
        }))
    );

    return { discountCodes: allCodes };
}

export const POST = withCreatorAuth(withErrorHandler(postHandler));
export const GET = withCreatorAuth(withErrorHandler(getHandler));
