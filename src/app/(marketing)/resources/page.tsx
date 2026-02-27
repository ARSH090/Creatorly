import { Metadata } from 'next';
import { BookOpen, Play, LifeBuoy, Users, Zap, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Resources | Creatorly - Learning & Support',
    description: 'Learn how to use Creatorly with our documentation, video tutorials, community, and customer support.',
};

const resourceCategories = [
    {
        name: 'Documentation',
        description: 'Complete guides and references for every feature',
        icon: BookOpen,
        resources: [
            { title: 'Getting Started Guide', href: '/docs/getting-started' },
            { title: 'Store Builder Handbook', href: '/docs/store-builder' },
            { title: 'Email Marketing Guide', href: '/docs/email-marketing' },
            { title: 'API Reference', href: '/docs/api-reference' },
            { title: 'Troubleshooting FAQ', href: '/docs/troubleshooting' }
        ]
    },
    {
        name: 'Video Tutorials',
        description: 'Step-by-step video guides for every feature',
        icon: Play,
        resources: [
            { title: 'Setting Up Your First Store', href: '/videos/setup-store' },
            { title: 'Creating Email Sequences', href: '/videos/email-sequences' },
            { title: 'Launching Your Course', href: '/videos/course-launch' },
            { title: 'Using Analytics', href: '/videos/analytics' },
            { title: 'Affiliate Program Setup', href: '/videos/affiliate-setup' }
        ]
    },
    {
        name: 'Creator Success',
        description: 'Real stories and strategies from successful creators',
        icon: Zap,
        resources: [
            { title: 'Case Study: $50k/month Store', href: '/success/case-study' },
            { title: 'Email Marketing Best Practices', href: '/success/email-best-practices' },
            { title: 'Course Launch Strategy', href: '/success/course-strategy' },
            { title: 'Community Building Guide', href: '/success/community-guide' },
            { title: 'Revenue Diversification', href: '/success/revenue-diversification' }
        ]
    },
    {
        name: 'Community',
        description: 'Connect with other creators and share ideas',
        icon: Users,
        resources: [
            { title: 'Creator Community Forum', href: '/community/forum' },
            { title: 'Discord Server', href: '/community/discord' },
            { title: 'Weekly Webinars', href: '/community/webinars' },
            { title: 'Creator Spotlight Blog', href: '/community/blog' },
            { title: 'Feature Requests', href: '/community/feature-requests' }
        ]
    },
    {
        name: 'Support',
        description: 'Get help from our support team',
        icon: LifeBuoy,
        resources: [
            { title: 'Contact Support', href: '/support/contact' },
            { title: 'Submit a Ticket', href: '/support/ticket' },
            { title: 'Check Status Page', href: '/support/status' },
            { title: 'Security & Privacy', href: '/support/security' },
            { title: 'Terms & Conditions', href: '/support/terms' }
        ]
    },
    {
        name: 'Integrations',
        description: 'Connect Creatorly with your favorite tools',
        icon: MessageSquare,
        resources: [
            { title: 'Zapier Integration', href: '/integrations/zapier' },
            { title: 'Stripe Connect', href: '/integrations/stripe' },
            { title: 'Email Provider Setup', href: '/integrations/email-setup' },
            { title: 'Custom Domain Guide', href: '/integrations/custom-domain' },
            { title: 'API Webhooks', href: '/integrations/api-webhooks' }
        ]
    }
];

export default function Resources() {
    return (
        <div className="min-h-screen bg-[#030303] text-white">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        Learn & Support
                    </span>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        Everything You Need to <span className="text-indigo-400">Succeed</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Learn from our docs, connect with creators, and get expert support when you need it.
                    </p>
                </div>

                {/* Resource Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                    {resourceCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <div
                                key={category.name}
                                className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300"
                            >
                                {/* Icon */}
                                <div className="mb-6 inline-flex p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <Icon className="w-6 h-6 text-indigo-400" />
                                </div>

                                {/* Title and Description */}
                                <h3 className="text-lg font-bold text-white mb-2">{category.name}</h3>
                                <p className="text-sm text-zinc-400 mb-6">{category.description}</p>

                                {/* Resource List */}
                                <div className="space-y-3">
                                    {category.resources.map((resource, idx) => (
                                        <a
                                            key={idx}
                                            href={resource.href}
                                            className="flex items-center gap-3 text-sm text-zinc-300 hover:text-indigo-400 transition-colors group"
                                        >
                                            <div className="w-1 h-1 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform" />
                                            {resource.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Links Section */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-12 text-center mb-24">
                    <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
                    <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
                        Our support team is here to help. We typically respond within 2 hours during business hours.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="mailto:support@creatorly.com"
                            className="px-8 py-4 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                        >
                            Email Support
                        </a>
                        <Link
                            href="/features"
                            className="px-8 py-4 rounded-full border border-indigo-500 text-indigo-400 font-bold hover:bg-indigo-500/10 transition-colors"
                        >
                            Back to Features
                        </Link>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    <p className="text-lg text-zinc-400 mb-8">Ready to start building?</p>
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/50 transition-all uppercase tracking-wide text-sm"
                    >
                        Start Free Today
                        <span>→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
