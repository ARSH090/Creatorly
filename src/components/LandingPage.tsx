'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  CreditCard,
  Globe,
  Lock,
  MousePointer2,
  Smartphone,
  Store,
  Zap,
  Instagram,
  Youtube,
  Twitter,
  Linkedin
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth mouse tracking for spotlight
  const mouseX = useSpring(0, { stiffness: 500, damping: 50 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) router.push(`/auth/register?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="dark min-h-screen bg-[#030303] text-zinc-400 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
      {/* Background Noise & Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Ffilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,%2380808012_1px,transparent_1px),linear-gradient(to_bottom,%2380808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,%23000_70%,transparent_100%)]"></div>

      {/* Spotlight Effect */}
      <motion.div
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(99, 102, 241, 0.06), transparent 80%)`
          )
        }}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.05] bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(79,70,229,0.4)]">C</div>
            <span className="text-lg font-bold text-white tracking-tight">Creatorly</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['Products', 'Pricing', 'Showcase', 'About'].map((item) => (
              <Link key={item} href="#" className="text-xs font-medium hover:text-white transition-colors uppercase tracking-widest">{item}</Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-xs font-bold text-white hover:opacity-70 transition-opacity uppercase tracking-widest">Sign In</Link>
            <Link href="/auth/register" className="h-9 px-4 rounded-full bg-white text-black text-xs font-bold flex items-center hover:bg-zinc-200 transition-colors uppercase tracking-widest">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Platform Live in Bharat</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tighter text-white leading-[0.9] mb-8"
          >
            The Operating System<br />
            <span className="text-zinc-600 italic">for the</span> Modern Creator.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Creatorly provides the professional infrastructure to build, scale, and monetize your digital presence across Bharat. Secure, industrial-grade, and built for speed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <form onSubmit={handleEmailSignup} className="group relative flex w-full max-w-md">
              <input
                type="text"
                placeholder="creatorly.link/username"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-full px-6 py-4 text-white font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="absolute right-1.5 top-1.5 bottom-1.5 px-6 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                Claim URL
              </button>
            </form>
          </motion.div>
        </div>

        {/* Visual Hero Mockups */}
        <div className="max-w-7xl mx-auto mt-24 relative px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative aspect-video rounded-2xl border border-white/[0.08] bg-zinc-900/50 backdrop-blur-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            {/* Dashboard Preview Mock */}
            <div className="absolute inset-0 p-8 grid grid-cols-12 gap-6 opacity-40">
              <div className="col-span-3 space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-8 w-full bg-white/5 rounded-lg border border-white/5" />)}
              </div>
              <div className="col-span-9 space-y-6">
                <div className="h-12 w-1/3 bg-white/10 rounded-xl" />
                <div className="grid grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />)}
                </div>
                <div className="h-64 w-full bg-white/5 rounded-2xl border border-white/5" />
              </div>
            </div>

            {/* Center Spotlight Video or Interactive Layer */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black cursor-pointer hover:scale-110 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <Zap className="fill-current w-8 h-8" />
              </div>
            </div>

            {/* Glass Accents */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-gradient(to_right,transparent,rgba(255,255,255,0.1),transparent)"></div>
          </motion.div>

          {/* Floating Accents */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"
          />
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute -bottom-12 -left-12 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full"
          />
        </div>
      </section>

      {/* Monochrome Brand Marquee */}
      <section className="py-20 border-y border-white/[0.05] bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] text-center mb-12">Empowering Creators Across All Platforms</p>
          <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-24 opacity-30 grayscale contrast-125">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
              <Instagram className="w-6 h-6" /> INSTAGRAM
            </div>
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
              <Youtube className="w-6 h-6" /> YOUTUBE
            </div>
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
              <Twitter className="w-6 h-6" /> TWITTER
            </div>
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
              <Linkedin className="w-6 h-6" /> LINKEDIN
            </div>
          </div>
        </div>
      </section>

      {/* The OS Section (Bento) */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-6">Designed for individuals,<br /><span className="text-zinc-500">engineered for scale.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Large Feature */}
            <div className="md:col-span-8 bg-zinc-900/40 border border-white/[0.05] rounded-3xl p-8 relative overflow-hidden group">
              <div className="relative z-10 max-w-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Enterprise-Grade Storefront</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">Built with performance in mind. Sell digital goods, courses, and premium content with sub-100ms checkout experiences.</p>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-gradient(to_left,rgba(99,102,241,0.05),transparent) pointer-events-none" />
              {/* Visual Accent */}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 border border-indigo-500/10 rounded-full group-hover:scale-110 transition-transform duration-700" />
            </div>

            <div className="md:col-span-4 bg-zinc-900/40 border border-white/[0.05] rounded-3xl p-8 group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant UPI Payouts</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Direct-to-bank settlements. Integrated with Razorpay for maximum reliability across all Indian banks.</p>
            </div>

            <div className="md:col-span-4 bg-zinc-900/40 border border-white/[0.05] rounded-3xl p-8">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 mb-6 border border-orange-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Advanced Analytics</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Understand your audience. Track conversion rates, peak traffic times, and regional density across Bharat.</p>
            </div>

            <div className="md:col-span-4 bg-zinc-900/40 border border-white/[0.05] rounded-3xl p-8">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Custom Domains</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Bring your own brand. Connect your custom .com or .in domains with automated SSL/TLS termination.</p>
            </div>

            <div className="md:col-span-4 bg-zinc-900/40 border border-white/[0.05] rounded-3xl p-8">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Hardened Security</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">SOC2-compliant security defaults. Fraud detection and automated threat mitigation for high-value creators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Creator Preview */}
      <section className="py-32 bg-black/40 border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mb-8">One Link.<br /><span className="text-zinc-600">Infinite Possibilities.</span></h2>
            <div className="space-y-6">
              {[
                { t: 'Bio-Link Optimization', d: 'Replace your scattered social links with a single, high-performance landing page.' },
                { t: 'Dynamic Inventory', d: 'Your products sync automatically. Add a digital product on mobile, it’s live in seconds.' },
                { t: 'Regional Compliance', d: 'Automatic GST calculation and HSN-compliant invoicing for the Indian market.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="mt-1 w-5 h-5 rounded-full border border-white/20 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                    <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.t}</h4>
                    <p className="text-sm text-zinc-500">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto w-[300px] h-[600px] rounded-[40px] border-[8px] border-zinc-900 shadow-2xl bg-[#080808] overflow-hidden">
              {/* Internal Mobile Preview Render */}
              <div className="p-6">
                <div className="w-16 h-16 rounded-full bg-zinc-800 mx-auto mb-4 border border-white/10" />
                <div className="h-4 w-24 bg-zinc-800 mx-auto mb-2 rounded-full" />
                <div className="h-3 w-32 bg-zinc-900 mx-auto mb-10 rounded-full" />

                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 w-full bg-zinc-900/50 border border-white/[0.03] rounded-2xl flex items-center px-4">
                      <div className="w-6 h-6 rounded bg-indigo-500/20" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
                <div className="w-24 h-4 bg-zinc-900 rounded-b-xl" />
              </div>
            </div>
            {/* Accents around phone */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full" />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-medium tracking-tight text-white mb-8">Ready to transition to<br />a pro-grade infrastructure?</h2>
          <p className="text-lg text-zinc-500 mb-12">Join the elite cohort of creators who choose precision over hype. No setup fees, no platform tax, just growth.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/auth/register" className="h-14 px-10 rounded-full bg-white text-black font-black uppercase tracking-widest flex items-center hover:bg-zinc-200 transition-all active:scale-95 group">
              Launch Now <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#" className="h-14 px-10 rounded-full bg-transparent border border-white/[0.08] text-white font-bold uppercase tracking-widest flex items-center hover:bg-white/[0.03] transition-all">
              View Showcase
            </Link>
          </div>
          <p className="mt-8 text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Available to all creators in Bharat with a valid UPI ID.</p>
        </div>
      </section>

      {/* Footer Industrial */}
      <footer className="py-20 border-t border-white/[0.05] bg-[#020202]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div>
            <p className="text-white font-bold mb-6 tracking-tighter uppercase text-xs">Product</p>
            <ul className="space-y-4 text-xs font-medium">
              <li><Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Storefront</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Analytics</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Payments</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Domains</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-6 tracking-tighter uppercase text-xs">Creators</p>
            <ul className="space-y-4 text-xs font-medium">
              <li><Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Showcase</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Resources</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Community</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-6 tracking-tighter uppercase text-xs">Legal</p>
            <ul className="space-y-4 text-xs font-medium">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors uppercase tracking-widest">Privacy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-white transition-colors uppercase tracking-widest">Terms</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-6 tracking-tighter uppercase text-xs">System</p>
            <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">All Systems Operational</span>
              </div>
              <p className="text-[10px] text-zinc-600 font-medium">Last Audit: Today, 08:30 PM</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xl font-black text-white tracking-tighter underline decoration-indigo-500 decoration-2 underline-offset-4">Creatorly</span>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">© 2026 Bharat Digital Infrastructure Group. Built for the Next Billion.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
