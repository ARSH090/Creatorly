
// This is now a Server Component to allow 'revalidate' export

import LandingPage from '@/components/LandingPage';

export const revalidate = 3600; // Cache for 1 hour

export default function Home() {
  return <LandingPage />;
}
