import { Metadata } from 'next';
import PricingPage from '@/components/landing/PricingPage';

export const metadata: Metadata = {
    title: 'Pricing | Creatorly',
    description: 'Simple, transparent pricing for creators. Start free with 14-day Pro trial. Upgrade as you grow.',
};

export default function Pricing() {
    return <PricingPage />;
}
