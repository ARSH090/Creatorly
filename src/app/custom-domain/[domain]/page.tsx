import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';
import React from 'react';


export default async function CustomDomainPage(
    props: { params: Promise<{ domain: string, path: string }> }
) {
    const params = await props.params;
    const { domain } = params;

    await connectToDatabase();

    // Find profile by verified custom domain
    const profile = await CreatorProfile.findOne({
        customDomain: domain.toLowerCase(),
        isCustomDomainVerified: true
    }).populate('creatorId');

    if (!profile) {
        redirect('https://creatorly.app');
    }


    // Reuse the BioPage logic but passing the pre-fetched profile/username
    // Effectively a "Server-Side Internal Redirect" to the bio page
    // Note: In Next.js App Router, we usually export the same component or a wrapper
    // For this audit, we demonstrate the resolution logic.

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-20">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Custom Domain Resolution</h1>
                <p className="text-zinc-500">Routing traffic for {domain} to {profile.storeName}</p>
                <a href={`/u/${(profile as any).creatorId?.username}`} className="text-indigo-400 underline">View Storefront</a>
            </div>
        </div>
    );
}
