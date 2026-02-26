import TrafficAnalytics from '@/lib/models/TrafficAnalytics';
import DailyMetric from '@/lib/models/DailyMetric';
import mongoose from 'mongoose';

/**
 * Records a storefront visit with optional UTM parameters
 */
export async function recordTrafficHit(creatorId: string, path: string, params: Record<string, string>, ip?: string, ua?: string) {
    try {
        const hit = await TrafficAnalytics.create({
            creatorId,
            path,
            utmSource: params.utm_source,
            utmMedium: params.utm_medium,
            utmCampaign: params.utm_campaign,
            utmTerm: params.utm_term,
            utmContent: params.utm_content,
            referrer: params.referrer,
            userAgent: ua,
            // In production, we'd hash the IP for unique visitor tracking
            ipHash: ip ? require('crypto').createHash('sha256').update(ip).digest('hex') : undefined
        });

        // Atomic increment of daily view metric for this source
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await DailyMetric.updateOne(
            {
                creatorId,
                date: today,
                metricType: 'views',
                source: params.utm_source || 'direct'
            },
            { $inc: { value: 1 } },
            { upsert: true }
        );

    } catch (error) {
        console.error('Error recording traffic hit:', error);
    }
}

/**
 * Records a conversion (order/revenue) attributed to a source
 */
export async function recordConversion(creatorId: string, source: string, amount: number) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Increment order count
        await DailyMetric.updateOne(
            { creatorId, date: today, metricType: 'orders', source: source || 'direct' },
            { $inc: { value: 1 } },
            { upsert: true }
        );

        // Increment revenue
        await DailyMetric.updateOne(
            { creatorId, date: today, metricType: 'revenue', source: source || 'direct' },
            { $inc: { value: amount } },
            { upsert: true }
        );
    } catch (error) {
        console.error('Error recording conversion:', error);
    }
}
