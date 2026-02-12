export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                <p className="text-sm text-gray-600 mb-8">Last Updated: February 12, 2026</p>

                <div className="prose prose-gray max-w-none space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing or using Creatorly, you agree to be bound by these Terms of Service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
                        <p>Creatorly is a creator commerce platform enabling content creators to sell digital products, courses, memberships, and services.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">3. Platform Fees</h2>
                        <ul className="list-disc pl-6">
                            <li>Free Plan: 5% transaction fee</li>
                            <li>Creator Plan: 3% transaction fee</li>
                            <li>Creator Pro: 0% transaction fee</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">4. Governing Law</h2>
                        <p>These terms are governed by the laws of India.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">5. Contact</h2>
                        <p>For questions about these terms, contact: <a href="mailto:legal@creatorly.in" className="text-blue-600 hover:underline">legal@creatorly.in</a></p>
                    </section>
                </div>
            </div>
        </div>
    );
}
