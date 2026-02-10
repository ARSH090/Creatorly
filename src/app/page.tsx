// This is now a Server Component to allow 'revalidate' export

import LandingPage from '@/components/LandingPage';

export const revalidate = 0;

export default function Home() {
  return <LandingPage />;
}
