import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { errorResponse } from '@/types/api';
import { decryptTokenWithVersion } from '@/lib/security/encryption';

/**
 * POST /api/checkout/bank/details
 * Retrieve decrypted bank details for P2P manual transfer
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { productId } = await req.json();

        const product = await Product.findById(productId);
        if (!product) return NextResponse.json(errorResponse('Product not found'), { status: 404 });

        const creator = await User.findById(product.creatorId);
        const bankConfig = creator?.paymentConfigs?.bank;

        if (!bankConfig?.active || !bankConfig?.accountNumber) {
            return NextResponse.json(errorResponse('Bank transfer not enabled by creator'), { status: 400 });
        }

        // Decrypt account number
        const accountNumber = decryptTokenWithVersion(
            bankConfig.accountNumber!,
            bankConfig.accountNumberIV!,
            bankConfig.accountNumberTag!,
            'v1'
        );

        return NextResponse.json({
            success: true,
            bankDetails: {
                accountNumber,
                ifsc: bankConfig.ifsc,
                holderName: bankConfig.holderName,
                bankName: bankConfig.bankName
            },
            creatorName: creator?.displayName
        });

    } catch (error: any) {
        return NextResponse.json(errorResponse(error.message), { status: 500 });
    }
}
