import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="font-outfit">
            <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 font-cabinet">Privacy Policy</h1>
            <p className="text-zinc-400 mb-8 italic">Last updated: February 8, 2026</p>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">1. Introduction</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Welcome to Creatorly. We are committed to protecting your personal data and your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">2. Data We Collect</h2>
                <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                    <li><strong>Profile Information:</strong> Name, email, username, and bio.</li>
                    <li><strong>Payment Data:</strong> We use Razorpay for payments. We do not store your credit card or UPI details on our servers.</li>
                    <li><strong>Transaction History:</strong> Records of products sold and purchased.</li>
                    <li><strong>Compliance Data:</strong> GST information as required by Indian tax laws.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">3. How We Use Your Data</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Your data is used to provide services, process payments via Razorpay, generate tax invoices, and prevent fraud. We do not sell your personal data to third parties.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">4. Security</h2>
                <p className="text-zinc-300 leading-relaxed">
                    We implement enterprise-grade security including SSL encryption, database hardening, and secure session management. All payment transactions are processed through Razorpay's secure infrastructure.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">5. Your Rights</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Under GDPR and the Indian IT Act, you have the right to access, rectify, or delete your data. Contact us at <span className="text-orange-400">privacy@creatorly.in</span> for any data requests.
                </p>
            </section>
        </div>
    );
}
