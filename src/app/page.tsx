import React from 'react';
import CreatorDashboard from '@/components/CreatorDashboard';
import BioLinkStore from '@/components/BioLinkStore';

export default function Home() {
  // We can toggle between Dashboard and Store for demo purposes
  const isDashboardView = false;

  return (
    <>
      {isDashboardView ? <CreatorDashboard /> : <BioLinkStore />}
    </>
  );
}
