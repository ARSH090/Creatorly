import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db/mongodb'
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent'
import { analyticsRateLimit } from '@/lib/security/analyticsLimiter'

export async function POST(req: NextRequest) {
  try {
    const limited = await analyticsRateLimit(req, 60, 60)
    if (limited) return limited
    await connectToDatabase()
    const body = await req.json()
    const { eventType, creatorId, path, referrer, productId, metadata } = body
    const allowed = ['page_view', 'product_view', 'performance', 'error']
    if (!eventType || !allowed.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
    }
    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 })
    }
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''
    const payload: any = {
      eventType,
      creatorId,
      productId: productId || undefined,
      ip,
      userAgent,
      referrer: referrer || '',
      path: path || '',
      metadata: metadata || {},
      createdAt: new Date()
    }
    const event = await (AnalyticsEvent as any).create(payload)
    return NextResponse.json({ success: true, eventId: event._id }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
