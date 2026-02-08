import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import ProductModel, { IProduct } from '@/lib/models/Product';
import BioLinkStore from '@/components/BioLinkStore';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CreatorStorefront({ params }: { params: { username: string } }) {
    await connectToDatabase();

    const creator = await User.findOne({ username: params.username });

    if (!creator) {
        notFound();
    }

    const products = await ProductModel.find({ creatorId: creator._id, isActive: true }) as IProduct[];

    // Transform MongoDB docs to plain objects for the client component
    const plainProducts = products.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        type: p.type as any,
        image: p.image,
    }));

    return (
        <BioLinkStore
            creatorName={creator.displayName}
            creatorBio={(creator as any).bio || ''}
            initialProducts={plainProducts as any}
        />
    );
}
