'use client';

import Link from 'next/link';
import Logo from './Logo';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, Mail, Users, TrendingUp, BookOpen, Zap, Globe, Wand2 } from 'lucide-react';

const Header: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const isLandingPage = pathname === '/';

  const services = [
    { icon: ShoppingCart, name: 'Store Builder', description: 'Sell products instantly' },
    { icon: ShoppingCart, name: 'Digital Products', description: 'Upload & sell files' },
    { icon: Mail, name: 'Email Marketing', description: 'Build your audience' },
    { icon: BookOpen, name: 'Course Hosting', description: 'Teach online courses' },
    { icon: Users, name: 'Subscription Memberships', description: 'Recurring revenue' },
    { icon: TrendingUp, name: 'Analytics', description: 'Track everything' },
    { icon: Wand2, name: 'AI Tools', description: 'Write better copy' },
    { icon: Zap, name: 'Automation', description: 'Run automations' },
    { icon: Users, name: 'Affiliate System', description: 'Grow with partners' },
    { icon: Globe, name: 'Custom Domain', description: 'Your branded URL' },
  ];

  const navLinks = [
    { href: '/', label: 'Home', hasMega: false },
    { href: '/features', label: 'Features', hasMega: true },
    { href: '/pricing', label: 'Pricing', hasMega: false },
    { href: '/resources', label: 'Resources', hasMega: false },
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

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className="text-xs font-bold text-zinc-500 hover:text-indigo-400 transition-colors uppercase tracking-[0.2em] py-6"
                  >
                    {link.label}
                  </Link>

                  {/* Mega Menu Dropdown */}
                  {link.hasMega && (
                    <div className="absolute left-0 mt-0 w-96 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pt-4">
                      <div className="p-8">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-6">Sell • Grow • Build</p>
                        <div className="grid grid-cols-2 gap-6">
                          {services.map((service, idx) => {
                            const Icon = service.icon;
                            return (
                              <a
                                key={idx}
                                href={`/features#${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                                className="group/item p-3 rounded-lg hover:bg-indigo-500/10 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-semibold text-white group-hover/item:text-indigo-400 transition-colors">{service.name}</p>
                                    <p className="text-xs text-zinc-500">{service.description}</p>
                                  </div>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                          <a href="/features" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold uppercase">
                            View All Features →
                          </a>
                          <Link href="/auth/register" target="_blank" rel="noopener noreferrer" className="text-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold uppercase">
                            Start Free
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/auth/login" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white hover:text-indigo-400 transition-colors uppercase tracking-widest">Sign In</Link>
              <Link href="/auth/register" target="_blank" rel="noopener noreferrer" className="h-9 px-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center hover:bg-indigo-700 transition-colors uppercase tracking-widest">
                Start Free
              </Link>
            </div>

            <button
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black pt-24 px-6 lg:hidden overflow-y-auto">
          <nav className="flex flex-col gap-2 pb-8">
            {navLinks.map((link) => (
              <div key={link.href}>
                <button
                  onClick={() => setActiveMegaMenu(activeMegaMenu === link.label ? null : link.label)}
                  className="w-full text-left text-lg font-bold text-white hover:text-indigo-400 transition-colors py-3 uppercase tracking-tight flex items-center justify-between"
                >
                  {link.label}
                  {link.hasMega && (
                    <span className={`transition-transform ${activeMegaMenu === link.label ? 'rotate-180' : ''}`}>›</span>
                  )}
                </button>

                {/* Mobile Mega Menu */}
                {link.hasMega && activeMegaMenu === link.label && (
                  <div className="pl-4 py-4 space-y-3 border-l border-indigo-500/30">
                    {services.map((service, idx) => {
                      const Icon = service.icon;
                      return (
                        <a
                          key={idx}
                          href={`/features#${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => {
                            setIsMenuOpen(false);
                            setActiveMegaMenu(null);
                          }}
                          className="block p-3 rounded-lg hover:bg-indigo-500/10 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-indigo-400" />
                            <div>
                              <p className="text-sm font-semibold text-white group-hover:text-indigo-400">{service.name}</p>
                              <p className="text-xs text-zinc-500">{service.description}</p>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <hr className="border-white/10 my-4" />
            <Link
              href="/auth/login"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-bold text-zinc-400 hover:text-indigo-400 transition-colors py-3 uppercase"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="w-full h-12 bg-indigo-600 text-white font-bold text-center flex items-center justify-center rounded-full uppercase tracking-wide hover:bg-indigo-700 transition-colors mt-2"
            >
              Start Building Free
            </Link>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
