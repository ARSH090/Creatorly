import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';
import { withAuth } from '@/lib/firebase/withAuth';
import dns from 'dns/promises';

export const POST = withAuth(async (req, user) => {
    try {
        const { domain } = await req.json();
        if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

        await connectToDatabase();
        const profile = await CreatorProfile.findOne({ creatorId: user._id });

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

        // Basic DNS verification logic
        // We look for a CNAME pointing to cname.creatorly.app or similar
        // For testing, we can check for a specific TXT record 

        try {
            const records = await dns.resolveCname(domain);
            const isValid = records.some(r => r.includes('creatorly.app'));

            if (isValid) {
                profile.isCustomDomainVerified = true;
                await profile.save();
                return NextResponse.json({ success: true, verified: true });
            }
        } catch (e) {
            // Fallback to TXT record check if CNAME fails
            try {
                const txtRecords = await dns.resolveTxt(domain);
                const verificationCode = `creatorly-verification=${profile._id}`;
                const hasTxt = txtRecords.some(records => records.some(r => r === verificationCode));

                if (hasTxt) {
                    profile.isCustomDomainVerified = true;
                    await profile.save();
                    return NextResponse.json({ success: true, verified: true });
                }
            } catch (txtError) {
                console.error('DNS Verification failed:', txtError);
            }
        }

        return NextResponse.json({
            success: false,
            verified: false,
            message: 'DNS records not found. Please ensure your CNAME or TXT record is correctly set.'
        });

    } catch (error: any) {
        console.error('Domain Verification Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});
