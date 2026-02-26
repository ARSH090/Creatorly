'use client';

import Link from 'next/link';
import Logo from './Logo';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLandingPage = pathname === '/';

  const navLinks = [
    { href: '#features', label: 'Infrastructure' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="group">
              <Logo
                className="h-10"
                iconClassName={isLandingPage ? "hidden" : "h-10 w-10"}
                showText={true}
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/login" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white hover:opacity-70 transition-opacity uppercase tracking-widest">Sign In</Link>
              <Link href="/auth/register" target="_blank" rel="noopener noreferrer" className="h-9 px-4 rounded-full bg-white text-black text-xs font-bold flex items-center hover:bg-zinc-200 transition-colors uppercase tracking-widest">
                Get Started
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black pt-24 px-6 md:hidden">
          <nav className="flex flex-col gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-black text-white tracking-tighter uppercase"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-white/10" />
            <Link
              href="/auth/login"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="w-full h-14 bg-white text-black font-black text-center flex items-center justify-center rounded-2xl uppercase tracking-[0.2em]"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
