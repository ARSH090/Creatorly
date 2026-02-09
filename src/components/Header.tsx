import Link from 'next/link';
import Logo from './Logo';
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="h-8" iconClassName="h-8 w-8" showText={true} />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Infrastructure</Link>
          <Link href="/privacy-policy" className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Privacy</Link>
          <Link href="/terms-of-service" className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Terms</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-xs font-bold text-white hover:opacity-70 transition-opacity uppercase tracking-widest">Sign In</Link>
          <Link href="/auth/register" className="h-9 px-4 rounded-full bg-white text-black text-xs font-bold flex items-center hover:bg-zinc-200 transition-colors uppercase tracking-widest">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
