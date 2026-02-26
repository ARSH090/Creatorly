import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { Product } from '@/lib/models/Product';
import StorefrontView from '@/components/storefront/StorefrontView';

interface StorefrontPageProps {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: StorefrontPageProps) {
    const { username } = await params;
    await connectToDatabase();
    const creator = await User.findOne({ username: username.toLowerCase() });
    
    if (!creator) {
        return { title: 'Not Found | Creatorly' };
    }

    return {
        title: `${creator.displayName} | Creatorly`,
        description: creator.bio || `Check out ${creator.displayName}'s store on Creatorly`,
    };
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
    const { username } = await params;
    await connectToDatabase();

    const creator = await User.findOne({ 
        username: username.toLowerCase(),
        status: 'active'
    }).lean();

    if (!creator) {
        notFound();
    }

    const products = await Product.find({
        creatorId: creator._id,
        status: 'active',
        isArchived: false
    }).sort({ createdAt: -1 }).lean();

    return (
        <StorefrontView 
            creator={JSON.parse(JSON.stringify(creator))}
            products={JSON.parse(JSON.stringify(products))}
        />
    );
}
