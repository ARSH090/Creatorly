/**
 * Creatorly Public API
 * REST API for third-party integrations
 * 
 * Documentation: https://api.creatorly.app/docs
 * Base URL: https://api.creatorly.app/v1
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';

const API_KEYS_DB = new Map<string, { creatorId: string; active: boolean; rateLimit: number }>();

/**
 * Verify API key
 */
function verifyApiKey(request: NextRequest): string | null {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) return null;

  const keyData = API_KEYS_DB.get(apiKey);
  if (!keyData || !keyData.active) return null;

  return keyData.creatorId;
}

/**
 * GET /api/v1/products
 * List all public products
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = request.nextUrl.pathname;

  // Check API key for protected endpoints
  if (path.includes('/creator/') || path.includes('/orders')) {
    const creatorId = verifyApiKey(request);
    if (!creatorId) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }
  }

  try {
    if (path.includes('/products')) {
      // List products
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      return NextResponse.json({
        products: [
          {
            id: 'prod_1',
            name: 'Sample Product',
            price: 99900,
            description: 'Product description',
            creatorId: 'creator_id',
          },
        ],
        pagination: { page, limit, total: 1 },
      });
    }

    if (path.includes('/creator/products')) {
      const creatorId = verifyApiKey(request);

      return NextResponse.json({
        products: [],
        creatorId,
      });
    }

    if (path.includes('/creator/orders')) {
      const creatorId = verifyApiKey(request);

      return NextResponse.json({
        orders: [],
        creatorId,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/creator/products
 * Create a product (requires API key)
 */
export async function POST(request: NextRequest) {
  const creatorId = verifyApiKey(request);

  if (!creatorId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const productSchema = z.object({
      name: z.string().min(3),
      description: z.string().min(10),
      price: z.number().min(100),
      category: z.string().optional(),
    });

    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Create product
    const product = {
      id: `prod_${Date.now()}`,
      ...validation.data,
      creatorId,
      createdAt: new Date(),
    };

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
