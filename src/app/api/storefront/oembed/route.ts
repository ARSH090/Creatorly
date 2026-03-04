import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const url = searchParams.get('url');

    if (!platform || !url) {
        return Response.json({ error: 'Missing platform or url parameter' }, { status: 400 });
    }

    const oembedUrls: Record<string, string> = {
        twitter: `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
        tiktok: `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        instagram: `https://graph.instagram.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
    };

    const oembedUrl = oembedUrls[platform];
    if (!oembedUrl) {
        return Response.json({ error: `Platform ${platform} not supported for oEmbed` }, { status: 400 });
    }

    try {
        const res = await fetch(oembedUrl);
        if (!res.ok) {
            return Response.json(
                { error: `Provider returned ${res.status}: ${res.statusText}` },
                { status: res.status === 404 ? 404 : 400 }
            );
        }
        const data = await res.json();
        return Response.json(data);
    } catch (error) {
        console.error('oEmbed fetch error:', error);
        return Response.json(
            { error: 'Failed to fetch embed data from external provider' },
            { status: 400 }
        );
    }
}
