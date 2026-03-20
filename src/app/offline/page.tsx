export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                    <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">You're offline</h1>
            <p className="text-zinc-500 text-sm max-w-xs mb-8">Check your internet connection and try again. Your dashboard data will sync when you're back online.</p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-sm transition-all"
            >
                Try again
            </button>
        </div>
    );
}
