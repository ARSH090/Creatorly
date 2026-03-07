export default function StorefrontNotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
            <div className="text-center space-y-6 max-w-md">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto text-4xl">
                    🔍
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                        404
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        This creator storefront doesn&apos;t exist (yet).
                    </p>
                </div>
                <a
                    href="/"
                    className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl transition-all text-sm"
                >
                    Back to Creatorly
                </a>
                <div className="pt-6 border-t border-white/5">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">
                        Creatorly
                    </p>
                </div>
            </div>
        </div>
    );
}
