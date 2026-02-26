'use client';
import React, { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    setVisible(consent !== 'yes');
  }, []);

  const accept = () => {
    document.cookie = `cookie_consent=1; path=/; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}`;
    localStorage.setItem('cookie-consent', 'yes');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[1000] bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl md:max-w-md md:left-auto">
      <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
        We use cookies to improve your experience, analyze usage, and enhance security.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setVisible(false)}
          className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          Dismiss
        </button>
        <button
          onClick={accept}
          className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-colors uppercase tracking-widest"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
