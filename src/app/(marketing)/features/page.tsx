import { Metadata } from 'next';
import { ShoppingCart, Mail, BookOpen, Users, TrendingUp, Globe, Wand2, Zap, BarChart3, Smartphone, Clock, Lock, Package, CreditCard } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Features | Creatorly - All-in-One Creator Platform',
    description: 'Discover all the powerful features in Creatorly: stores, courses, email marketing, automation, analytics, and more. Everything you need to build your creator business.',
};

const features = [
    {
        id: 'store-builder',
        icon: ShoppingCart,
        name: 'Store Builder',
        title: 'Launch Your Store in Minutes',
        description: 'Drag-and-drop store editor. No coding required. Fully customizable with your own domain.',
        features: ['Unlimited products', 'Custom domain', 'SEO optimization', 'Mobile responsive', 'One-click checkout', 'Coupon codes']
    },
    {
        id: 'digital-products',
        icon: Package,
        name: 'Digital Products',
        title: 'Sell Any Digital File',
        description: 'Sell eBooks, templates, presets, music, software, and any digital download with instant delivery.',
        features: ['Instant delivery', 'Multiple file types', 'Product previews', 'Bulk upload', 'Version control', 'Access logs']
    },
    {
        id: 'email-marketing',
        icon: Mail,
        name: 'Email Marketing',
        title: 'Build Your Audience',
        description: 'Email automation sequences, broadcast campaigns, and audience segmentation built right in.',
        features: ['Automation workflows', 'Broadcast campaigns', 'Segmentation', 'Behavioral triggers', 'Open/click tracking', 'Revenue analytics']
    },
    {
        id: 'courses',
        icon: BookOpen,
        name: 'Course Hosting',
        title: 'Teach Online Courses',
        description: 'Host video courses with drip content, progress tracking, and student certificates.',
        features: ['Video hosting', 'Lesson sequencing', 'Drip content', 'Certificates', 'Discussion boards', 'Community access']
    },
    {
        id: 'memberships',
        icon: Users,
        name: 'Subscriptions & Memberships',
        title: 'Recurring Revenue',
        description: 'Create tiered membership programs with gated content and automatic billing.',
        features: ['Multiple tiers', 'Content gating', 'Recurring billing', 'Churn recovery', 'Member portal', 'Exclusive access']
    },
    {
        id: 'affiliate',
        icon: Users,
        name: 'Affiliate System',
        title: 'Grow Through Partners',
        description: 'Launch your affiliate program. Pay affiliates only when they deliver results.',
        features: ['One-click setup', 'Custom commissions', 'Affiliate dashboard', 'Auto payouts', 'Link tracking', 'Real-time reporting']
    },
    {
        id: 'analytics',
        icon: TrendingUp,
        name: 'Analytics Dashboard',
        title: 'Know What\'s Working',
        description: 'Real-time revenue tracking, product analytics, traffic attribution, and customer insights.',
        features: ['Revenue tracking', 'Conversion rates', 'Traffic attribution', 'Customer LTV', 'Funnel analytics', 'Email ROI']
    },
    {
        id: 'domain',
        icon: Globe,
        name: 'Custom Domain',
        title: 'Build Your Brand',
        description: 'Connect any domain with free SSL, automatic DNS setup, and custom email.',
        features: ['Free SSL', 'Auto DNS', 'Email setup', 'Subdomain routing', 'Domain health monitoring', 'Instant activation']
    },
    {
        id: 'ai-tools',
        icon: Wand2,
        name: 'AI Content Tools',
        title: 'Write Better, Faster',
        description: 'Generate product descriptions, email subject lines, and sales copy with AI.',
        features: ['Product descriptions', 'Email subject lines', 'Sales copy', 'Social captions', 'SEO optimization', 'A/B variants']
    },
    {
        id: 'automation',
        icon: Zap,
        name: 'Automation Workflows',
        title: 'Run on Autopilot',
        description: 'Connect triggers to actions. Customer buys → welcome email → added to membership.',
        features: ['Visual builder', 'Triggers & actions', 'Conditional logic', 'Native integrations', 'Zapier support', 'Error logging']
    },
    {
        id: 'payments',
        icon: CreditCard,
        name: 'Payment Processing',
        title: 'Accept Payments Anywhere',
        description: 'Stripe-powered checkout with 135+ currencies, Apple Pay, Google Pay, and BNPL.',
        features: ['Multiple currencies', 'Apple Pay', 'Google Pay', 'Klarna/Afterpay', 'Subscription billing', 'Instant payouts']
    },
    {
        id: 'bio-link',
        icon: Smartphone,
        name: 'Link-in-Bio',
        title: 'Convert Your Bio',
        description: 'Replace generic link-in-bio with a high-converting profile page.',
        features: ['Custom branding', 'Product showcase', 'Email capture', 'Click analytics', 'Social links', 'Video embeds']
    }
];

export default function Features() {
    return (
        <div className="min-h-screen bg-[#030303] text-white">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        Everything You Need
                    </span>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                        All Tools. One Platform. <span className="text-indigo-400">Zero Complexity</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Stop juggling 5+ platforms. Everything you need to build, grow, and scale your creator business is here.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.id}
                                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300"
                            >
                                {/* Icon */}
                                <div className="mb-6 inline-flex p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
                                    <Icon className="w-6 h-6 text-indigo-400" />
                                </div>

                                {/* Title and Description */}
                                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-zinc-400 mb-6">{feature.description}</p>

                                {/* Features List */}
                                <div className="space-y-3 mb-6">
                                    {feature.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                            {feat}
                                        </div>
                                    ))}
                                </div>

                                {/* Learn More Link */}
                                <Link
                                    href="/features"
                                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group-hover:translate-x-1 inline-flex gap-1"
                                >
                                    Learn more →
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="mt-24 text-center">
                    <p className="text-lg text-zinc-400 mb-8">Ready to build your creator business?</p>
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/50 transition-all uppercase tracking-wide text-sm"
                    >
                        Start Free Today
                        <span>→</span>
                    </Link>
                    <p className="text-xs text-zinc-600 mt-4">✓ No credit card required • ✓ Free forever plan • ✓ 14-day Pro trial</p>
                </div>
            </div>
        </div>
    );
}

