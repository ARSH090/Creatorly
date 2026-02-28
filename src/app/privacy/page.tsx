export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <div className="prose prose-gray max-w-none">
                    <p className="text-sm text-gray-600 mb-8">Last Updated: February 12, 2026</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                        <p>We collect information you provide directly, including:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Account information (name, email, password)</li>
                            <li>Payment information (processed by Razorpay)</li>
                            <li>Content you upload (products, courses, etc.)</li>
                            <li>Usage data and analytics</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide and maintain the Service</li>
                            <li>Process payments and transactions</li>
                            <li>Send transactional emails</li>
                            <li>Improve and optimize the platform</li>
                            <li>Prevent fraud and abuse</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
                        <p>We do not sell your personal information. We share data with:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Payment processors (Razorpay)</li>
                            <li>Cloud storage providers (AWS S3)</li>
                            <li>Analytics services (anonymized)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                        <p>We use industry-standard security measures including encryption, secure HTTPS, and regular security audits.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Access your personal data</li>
                            <li>Request data deletion</li>
                            <li>Export your data</li>
                            <li>Opt out of marketing emails</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
                        <p>We use essential cookies for authentication and analytics cookies to improve our service.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">7. GDPR Compliance</h2>
                        <p>For EU users, we comply with GDPR requirements including data portability and the right to be forgotten.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">8. Changes to Privacy Policy</h2>
                        <p>We may update this policy and will notify users of significant changes.</p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
                        <p>For privacy concerns, contact: privacy@creatorly.in</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
