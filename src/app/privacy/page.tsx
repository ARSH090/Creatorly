import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white py-12 sm:py-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back link */}
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-medium transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl backdrop-blur-xl">
                    <div className="prose prose-invert prose-orange max-w-none">
                        <h1 className="text-3xl sm:text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Privacy Policy</h1>
                        <p className="text-zinc-400 mb-8 italic text-sm">Last Updated: February 12, 2026</p>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">1. Information We Collect</h2>
                            <p className="text-zinc-300 leading-relaxed mb-3">We collect information you provide directly, including:</p>
                            <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                                <li><strong className="text-white">Account information</strong> — Name, email, password</li>
                                <li><strong className="text-white">Payment information</strong> — Processed securely by Razorpay. We never store your card or UPI details.</li>
                                <li><strong className="text-white">Content you upload</strong> — Products, courses, and other digital goods</li>
                                <li><strong className="text-white">Usage data</strong> — Analytics and browsing patterns</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">2. How We Use Your Information</h2>
                            <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                                <li>Provide and maintain the Service</li>
                                <li>Process payments and transactions</li>
                                <li>Send transactional emails</li>
                                <li>Improve and optimize the platform</li>
                                <li>Prevent fraud and abuse</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">3. Information Sharing</h2>
                            <p className="text-zinc-300 leading-relaxed mb-3">We do not sell your personal information. We share data with:</p>
                            <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                                <li>Payment processors (Razorpay)</li>
                                <li>Cloud storage providers (AWS S3)</li>
                                <li>Analytics services (anonymized)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">4. Data Security</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                We implement enterprise-grade security including SSL encryption, database hardening, and secure session management. All payment transactions are processed through Razorpay&apos;s secure infrastructure.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">5. Your Rights</h2>
                            <p className="text-zinc-300 leading-relaxed mb-3">You have the right to:</p>
                            <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                                <li>Access your personal data</li>
                                <li>Request data deletion</li>
                                <li>Export your data</li>
                                <li>Opt out of marketing emails</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">6. Cookies</h2>
                            <p className="text-zinc-300 leading-relaxed">We use essential cookies for authentication and analytics cookies to improve our service.</p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">7. GDPR &amp; Indian IT Act Compliance</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                For EU users, we comply with GDPR requirements including data portability and the right to be forgotten. For Indian users, we comply with the IT Act 2000 and RBI guidelines.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">8. Changes to Privacy Policy</h2>
                            <p className="text-zinc-300 leading-relaxed">We may update this policy and will notify users of significant changes.</p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">9. Contact Us</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                For privacy concerns, contact: <span className="text-orange-400">privacy@creatorly.in</span>
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
                        <p className="text-zinc-500 text-xs sm:text-sm">
                            &copy; 2026 Creatorly. In compliance with Indian IT Act 2000 &amp; RBI Guidelines.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
