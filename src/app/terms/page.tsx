import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
                        <h1 className="text-3xl sm:text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Terms of Service</h1>
                        <p className="text-zinc-400 mb-8 italic text-sm">Last Updated: February 12, 2026</p>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">1. Acceptance of Terms</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                By accessing or using Creatorly, you agree to be bound by these Terms of Service and all applicable laws and regulations in India.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">2. Description of Service</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                Creatorly is a creator commerce platform enabling content creators to sell digital products, courses, memberships, and services.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">3. Platform Fees</h2>
                            <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                                <li><strong className="text-white">Free Plan:</strong> 5% transaction fee</li>
                                <li><strong className="text-white">Creator Plan:</strong> 3% transaction fee</li>
                                <li><strong className="text-white">Creator Pro:</strong> 0% transaction fee</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">4. Creator Responsibilities</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                Creators are responsible for the content they publish and the products they sell. All products must comply with Indian laws. Tax (GST) collection and filing are the responsibility of the creator unless otherwise specified.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">5. Prohibited Content</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                Users may not sell illegal goods, adult content, or copyrighted material without authorization. Violation will result in immediate account suspension.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">6. Payments and Payouts</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                Payments are processed via Razorpay. Creatorly charges a platform fee on every transaction. Payouts are made to the creator&apos;s verified bank account or UPI ID.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">7. Limitation of Liability</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                Creatorly is a platform provider and is not liable for disputes between creators and their customers, though we will provide assistance in case of payment failures.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">8. Governing Law</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                These terms are governed by the laws of India.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">9. Contact</h2>
                            <p className="text-zinc-300 leading-relaxed">
                                For questions about these terms, contact: <a href="mailto:legal@creatorly.in" className="text-orange-400 hover:text-orange-300 transition-colors">legal@creatorly.in</a>
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
