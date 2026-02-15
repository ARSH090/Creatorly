import React from 'react';

export default function RefundPolicy() {
    return (
        <div className="font-outfit">
            <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 font-cabinet">Refund Policy</h1>
            <p className="text-zinc-400 mb-8 italic">Last updated: February 15, 2026</p>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">1. Digital Products</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Due to the nature of digital products (including but not limited to courses, digital downloads, and memberships), all sales are final. Once access is granted or the file is downloaded, no refunds will be issued.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">2. Coaching & Services</h2>
                <p className="text-zinc-300 leading-relaxed">
                    For coaching sessions or scheduled services, refunds can be requested up to 24 hours before the scheduled time. Cancellations within 24 hours of the appointment are non-refundable.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">3. Defective Products</h2>
                <p className="text-zinc-300 leading-relaxed">
                    If a digital file is corrupted or technically defective, please contact support within 48 hours of purchase. We will replace the file or, if a replacement is not possible, issue a full refund at our discretion.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">4. Refund Process</h2>
                <p className="text-zinc-300 leading-relaxed">
                    Approved refunds will be processed via Razorpay and credited back to your original payment method (Bank Account, UPI, or Card) within 5-7 business days, as per standard banking procedures.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">5. Contact Support</h2>
                <p className="text-zinc-300 leading-relaxed">
                    For all refund-related queries, please write to <span className="text-orange-400">support@creatorly.in</span> with your order ID and reason for the request.
                </p>
            </section>
        </div>
    );
}
