import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Features | Creatorly',
    description: 'Everything you need to build, monetize, and grow your creator business.',
};

export default function Features() {
    return (
        <div className="min-h-screen bg-[#030303] text-white">
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold tracking-tight mb-6">
                        Everything You Need to <span className="text-indigo-400">Succeed</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Powerful tools designed specifically for creators to monetize their audience.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            title: 'Digital Products',
                            description: 'Sell ebooks, templates, presets, and any digital download.',
                            icon: '📦'
                        },
                        {
                            title: 'Online Courses',
                            description: 'Host and sell video courses with progress tracking.',
                            icon: '🎓'
                        },
                        {
                            title: 'Memberships',
                            description: 'Recurring revenue with exclusive community access.',
                            icon: '👥'
                        },
                        {
                            title: 'Booking System',
                            description: 'Let clients book calls and services directly.',
                            icon: '📅'
                        },
                        {
                            title: 'AutoDM',
                            description: 'Automated Instagram and WhatsApp messaging.',
                            icon: '🤖'
                        },
                        {
                            title: 'Analytics',
                            description: 'Deep insights into your revenue and audience.',
                            icon: '📊'
                        }
                    ].map((feature, i) => (
                        <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-colors">
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-zinc-400">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
