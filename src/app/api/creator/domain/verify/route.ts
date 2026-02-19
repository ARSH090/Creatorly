import { NextRequest, NextResponse } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CreatorProfile } from '@/lib/models/CreatorProfile';

/**
 * Verifies that a custom domain has the correct CNAME pointing to Vercel.
 * We perform a DNS-over-HTTPS lookup using Cloudflare's 1.1.1.1 resolver.
 */
async function handler(req: NextRequest, user: any) {
    const body = await req.json();
    const { domain } = body as { domain: string };

    if (!domain) {
        return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
        // Use Cloudflare DNS over HTTPS to resolve CNAME
        const [cnameRes, aRes] = await Promise.all([
            fetch(`https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=CNAME`, {
                headers: { Accept: 'application/dns-json' },
            }),
            fetch(`https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`, {
                headers: { Accept: 'application/dns-json' },
            }),
        ]);

        const [cnameData, aData] = await Promise.all([cnameRes.json(), aRes.json()]);

        // Vercel-compatible CNAME value
        const validCnames = ['cname.vercel-dns.com.'];
        // Vercel shared IP (Vercel Anycast)
        const validARecords = ['76.76.21.21'];

        const cnameSatisfied = cnameData.Answer?.some((record: any) =>
            validCnames.includes(record.data?.toLowerCase())
        );

        const aSatisfied = aData.Answer?.some((record: any) =>
            validARecords.includes(record.data?.trim())
        );

        const verified = !!(cnameSatisfied || aSatisfied);

        if (verified) {
            // Persist the verified status on the creator profile
            await connectToDatabase();
            await CreatorProfile.findOneAndUpdate(
                { creatorId: user._id },
                { customDomain: cleanDomain, domainVerified: true }
            );
        }

        return NextResponse.json({
            verified,
            domain: cleanDomain,
            cname: cnameSatisfied,
            aRecord: aSatisfied,
        });
    } catch (err: any) {
        console.error('Domain verification error:', err);
        return NextResponse.json(
            { error: 'DNS lookup failed', details: err.message },
            { status: 500 }
        );
    }
}

export const POST = withCreatorAuth(withErrorHandler(handler));
