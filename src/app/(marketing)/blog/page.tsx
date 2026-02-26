import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog | Creatorly',
    description: 'Tips, strategies, and insights for creators building their business.',
};

export default function Blog() {
    return (
        <div className="min-h-screen bg-[#030303] text-white">
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold tracking-tight mb-6">
                        Creator <span className="text-indigo-400">Resources</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Learn how to grow, monetize, and scale your creator business.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <article key={i} className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-colors group cursor-pointer">
                            <div className="h-48 bg-gradient-to-br from-indigo-600/20 to-purple-600/20" />
                            <div className="p-6">
                                <div className="text-sm text-indigo-400 font-medium mb-2">Strategy</div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                                    How to Launch Your First Digital Product
                                </h3>
                                <p className="text-zinc-400 text-sm">
                                    A complete guide to creating, pricing, and selling your first digital product...
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
