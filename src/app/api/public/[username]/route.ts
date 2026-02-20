import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import CreatorProfile from '@/lib/models/CreatorProfile';

export const dynamic = 'force-static';
export const revalidate = 60;

/**
 * GET /api/public/[username]
 *
 * Returns a creator's public profile and storefront configuration.
 * This is an unauthenticated, publicly cacheable endpoint.
 * Sensitive fields (tokens, billing, calendar config) are excluded.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    try {
        await connectToDatabase();

        const creator = await User.findOne({ username: username.toLowerCase() })
            .select('displayName username avatar bio createdAt isSuspended status')
            .lean();

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator not found' },
                {
                    status: 404,
                    headers: {
                        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        // Return suspended state without full profile
        if ((creator as any).isSuspended || (creator as any).status === 'suspended') {
            return NextResponse.json(
                { error: 'Creator suspended', suspended: true },
                {
                    status: 403,
                    headers: {
                        'Cache-Control': 'public, s-maxage=60',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        const profile = await CreatorProfile.findOne({ creatorId: (creator as any)._id })
            .select('-availability.googleCalendarTokens -availability.googleCalendarId')
            .lean();

        const defaultTheme = {
            primaryColor: '#6366f1',
            secondaryColor: '#a855f7',
            accentColor: '#ec4899',
            backgroundColor: '#030303',
            textColor: '#ffffff',
            fontFamily: 'Inter',
            borderRadius: 'md',
            buttonStyle: 'rounded',
        };

        const response = {
            creator: {
                displayName: (creator as any).displayName || username,
                username: (creator as any).username,
                bio: (profile as any)?.description || (creator as any).bio || '',
                avatar: (creator as any).avatar || '',
                logo: (profile as any)?.logo || null,
                joinedDate: (creator as any).createdAt
                    ? new Date((creator as any).createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : '2024',
                socialLinks: (profile as any)?.socialLinks || {},
            },
            profile: {
                theme: (profile as any)?.theme || defaultTheme,
                serviceButtons: ((profile as any)?.serviceButtons || [])
                    .filter((b: any) => b.isVisible)
                    .sort((a: any, b: any) => a.order - b.order),
                links: ((profile as any)?.links || [])
                    .filter((l: any) => {
                        if (!l.isActive || !l.url) return false;
                        const now = new Date();
                        if (l.scheduleStart && new Date(l.scheduleStart) > now) return false;
                        if (l.scheduleEnd && new Date(l.scheduleEnd) < now) return false;
                        return true;
                    })
                    .sort((a: any, b: any) => a.order - b.order),
                socialLinks: (profile as any)?.socialLinks || {},
                features: {
                    newsletterEnabled: (profile as any)?.features?.newsletterEnabled ?? true,
                    whatsappEnabled: (profile as any)?.features?.whatsappEnabled ?? true,
                    storefrontEnabled: (profile as any)?.features?.storefrontEnabled ?? true,
                },
            },
        };

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                'CDN-Cache-Control': 'public, s-maxage=60',
                'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
            },
        });
    } catch (error) {
        console.error('[/api/public/[username]] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
    }
}

/** Handle CORS preflight */
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
