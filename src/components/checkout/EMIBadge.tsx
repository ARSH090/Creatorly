'use client';

interface EMIBadgeProps {
    priceInPaise: number;
    months?: number;
}

export default function EMIBadge({ priceInPaise, months = 3 }: EMIBadgeProps) {
    if (priceInPaise < 200000) return null; // Only show for ₹2000+

    const emiAmount = Math.ceil(priceInPaise / months / 100);

    return (
        <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg px-3 py-1.5 text-xs font-semibold">
            <span>EMI from ₹{emiAmount.toLocaleString('en-IN')}/month</span>
            <span className="text-green-600">· {months} months</span>
        </div>
    );
}
