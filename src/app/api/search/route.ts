import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1, 'Search query required'),
  type: z.enum(['products', 'creators', 'orders']).default('products'),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sortBy: z.enum(['relevance', 'price', 'rating', 'date']).default('relevance'),
  page: z.number().default(1),
  limit: z.number().default(20),
});

/**
 * Advanced search across products, creators, and orders
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const validation = searchSchema.safeParse({
      q: searchParams.get('q'),
      type: searchParams.get('type'),
      category: searchParams.get('category'),
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      sortBy: searchParams.get('sortBy'),
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    });

    if (!validation.success) {
      return NextResponse.json(
        { details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { q, type, category, minPrice, maxPrice, sortBy, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    let results: any[] = [];
    let total = 0;

    if (type === 'products') {
      // Full-text search on products
      const filter: Record<string, any> = {
        $text: { $search: q },
      };

      if (category) {
        filter.category = category;
      }

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = minPrice;
        if (maxPrice) filter.price.$lte = maxPrice;
      }

      const sortOptions: Record<string, any> = {
        relevance: { score: { $meta: 'textScore' } },
        price: { price: 1 },
        rating: { rating: -1 },
        date: { createdAt: -1 },
      };

      results = await Product.find(filter)
        .select(sortBy === 'relevance' ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOptions[sortBy])
        .skip(skip)
        .limit(limit)
        .lean();

      total = await Product.countDocuments(filter);
    } else if (type === 'creators') {
      // Search creators
      const filter = {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { displayName: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } },
        ],
      };

      results = await User.find(filter)
        .select('username displayName avatar bio')
        .skip(skip)
        .limit(limit)
        .lean();

      total = await User.countDocuments(filter);
    } else if (type === 'orders') {
      // Search orders (admin only - would need auth check)
      const filter = {
        $or: [
          { razorpayOrderId: { $regex: q, $options: 'i' } },
          { customerEmail: { $regex: q, $options: 'i' } },
        ],
      };

      results = await Order.find(filter)
        .populate('productId')
        .populate('creatorId', 'displayName')
        .skip(skip)
        .limit(limit)
        .lean();

      total = await Order.countDocuments(filter);
    }

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
