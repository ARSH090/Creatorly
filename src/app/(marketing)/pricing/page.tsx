import { Metadata } from 'next';
import PricingPage from '@/components/landing/PricingPage';

export const metadata: Metadata = {
    title: 'Pricing | Creatorly',
    description: 'Choose the perfect plan for your creator business. Start free, upgrade as you grow.',
};

export default function Pricing() {
    return <PricingPage />;
}
