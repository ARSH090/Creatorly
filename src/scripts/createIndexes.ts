import { connectToDatabase } from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import Product from '@/lib/models/Product'
import Order from '@/lib/models/Order'
import Subscriber from '@/lib/models/Subscriber'
import AdminLog from '@/lib/models/AdminLog'
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent'
import { AutoDMLog } from '@/lib/models/AutoDMLog'

async function createAllIndexes() {
    await connectToDatabase()
    console.log('Creating indexes...')

    // ── USER ──────────────────────────────────────────
    await User.collection.createIndex({ clerkId: 1 }, { unique: true })
    await User.collection.createIndex({ email: 1 }, { unique: true })
    await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true })
    await User.collection.createIndex({ plan: 1 })
    await User.collection.createIndex({ subscriptionStatus: 1 })
    await User.collection.createIndex({ isBanned: 1 })
    await User.collection.createIndex({ createdAt: -1 })
    await User.collection.createIndex({ googleCalendarChannelExpiry: 1 })

    // ── PRODUCT ───────────────────────────────────────
    await Product.collection.createIndex({ creatorId: 1, status: 1 })
    await Product.collection.createIndex({ creatorId: 1, createdAt: -1 })
    await Product.collection.createIndex({ slug: 1, creatorId: 1 }, { unique: true })
    await Product.collection.createIndex({ isFlagged: 1 })
    await Product.collection.createIndex({ hiddenByPlanLimit: 1 })
    await Product.collection.createIndex(
        { name: 'text', description: 'text' },
        { weights: { name: 10, description: 1 } }
    )

    // ── ORDER ─────────────────────────────────────────
    await Order.collection.createIndex({ creatorId: 1, status: 1 })
    await Order.collection.createIndex({ creatorId: 1, createdAt: -1 })
    await Order.collection.createIndex({ buyerEmail: 1 })
    await Order.collection.createIndex({ razorpayOrderId: 1 }, { unique: true, sparse: true })
    await Order.collection.createIndex({ status: 1, createdAt: -1 })

    // ── SUBSCRIBER ────────────────────────────────────
    await Subscriber.collection.createIndex({ creatorId: 1, email: 1 }, { unique: true })
    await Subscriber.collection.createIndex({ creatorId: 1, status: 1 })
    await Subscriber.collection.createIndex({ creatorId: 1, tags: 1 })
    await Subscriber.collection.createIndex({ unsubscribeToken: 1 }, { unique: true })

    // ── ADMIN LOG ─────────────────────────────────────
    await AdminLog.collection.createIndex({ createdAt: -1 })
    await AdminLog.collection.createIndex({ action: 1, createdAt: -1 })
    await AdminLog.collection.createIndex({ targetType: 1, targetId: 1 })

    // ── ANALYTICS ─────────────────────────────────────
    await AnalyticsEvent.collection.createIndex({ creatorId: 1, createdAt: -1 })
    await AnalyticsEvent.collection.createIndex({ creatorId: 1, eventType: 1 })
    await AnalyticsEvent.collection.createIndex({ sessionId: 1 })
    // TTL index — auto-delete raw events after 90 days (keep aggregates)
    await AnalyticsEvent.collection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 90 * 24 * 60 * 60 }
    )

    // ── AUTODM ────────────────────────────────────────
    await AutoDMLog.collection.createIndex({ creatorId: 1, createdAt: -1 })
    await AutoDMLog.collection.createIndex({ status: 1, createdAt: -1 })
    // TTL — delete DM logs after 30 days
    await AutoDMLog.collection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 30 * 24 * 60 * 60 }
    )

    console.log('All indexes created successfully.')
    process.exit(0)
}

createAllIndexes().catch((err) => {
    console.error('Index creation failed:', err)
    process.exit(1)
})
