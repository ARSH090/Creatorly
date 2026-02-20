import { NextRequest } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { getCreatorWidgets, updateWidget, reorderWidgets } from '@/lib/services/dashboardService';

/**
 * GET /api/dashboard/widgets
 * Get all widgets for the creator
 */
async function getHandler(req: NextRequest, user: any) {
    const widgets = await getCreatorWidgets(user._id.toString());
    return { widgets };
}

/**
 * PUT /api/dashboard/widgets
 * Update widget configuration or reorder widgets
 */
async function putHandler(req: NextRequest, user: any) {
    const body = await req.json();
    const creatorId = user._id.toString();

    if (body.widgetOrders && Array.isArray(body.widgetOrders)) {
        // Reorder widgets
        await reorderWidgets(creatorId, body.widgetOrders);
        return { success: true };
    }

    if (body.widgetId && body.updates) {
        // Update single widget
        const widget = await updateWidget(creatorId, body.widgetId, body.updates);
        return { widget };
    }

    throw new Error('Invalid request body');
}

async function handler(req: NextRequest, user: any) {
    if (req.method === 'GET') {
        return getHandler(req, user);
    }
    if (req.method === 'PUT') {
        return putHandler(req, user);
    }
    throw new Error('Method not allowed');
}

export const GET = withCreatorAuth(withErrorHandler(handler));
export const PUT = withCreatorAuth(withErrorHandler(handler));
