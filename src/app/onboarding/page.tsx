import OnboardFlow from './OnboardFlow';

export const metadata = {
    title: 'Onboarding | Creatorly',
    description: 'Setup your creator store in seconds.'
};

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
            {/* Background Noise & Glow */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />

            <main className="relative z-10">
                <OnboardFlow />
            </main>

            <footer className="py-12 opacity-20 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Onboarding • Razorpay Certified</p>
            </footer>
        </div>
    );
}
