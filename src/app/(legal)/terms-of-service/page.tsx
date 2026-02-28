import React from 'react';

export default function TermsOfService() {
    return (
        <div className="font-outfit">
            <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 font-cabinet">Terms of Service</h1>
            <p className="text-zinc-400 mb-8 italic">Last updated: February 8, 2026</p>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">1. Acceptance of Terms</h2>
                <p className="text-zinc-300 leading-relaxed">
                    By accessing or using Creatorly, you agree to be bound by these Terms of Service and all applicable laws and regulations in India.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">2. Creator Responsibilities</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Creators are responsible for the content they publish and the products they sell. All products must comply with Indian laws. Tax (GST) collection and filing are the responsibility of the creator unless otherwise specified.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">3. Payments and Payouts</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Payments are processed via Razorpay. Creatorly charges a platform fee on every transaction. Payouts are made to the creator&apos;s verified bank account or UPI ID.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">4. Prohibited Content</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Users may not sell illegal goods, adult content, or copyrighted material without authorization. Violation will result in immediate account suspension.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">5. Limitation of Liability</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Creatorly is a platform provider and is not liable for disputes between creators and their customers, though we will provide assistance in case of payment failures.
                </p>
            </section>
        </div>
    );
}
