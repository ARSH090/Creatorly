import Link from 'next/link';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-16 md:py-24 border-t border-white/5 bg-[#020202]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
        <div>
          <p className="text-white font-bold mb-6 tracking-tighter uppercase text-xs">Infrastructure</p>
          <ul className="space-y-4 text-[10px] font-bold text-zinc-500">
            <li><Link href="#features" className="hover:text-white transition-colors uppercase tracking-widest">Storefront</Link></li>
            <li><Link href="#features" className="hover:text-white transition-colors uppercase tracking-widest">Analytics</Link></li>
            <li><Link href="#features" className="hover:text-white transition-colors uppercase tracking-widest">Payments</Link></li>
            <li><Link href="/auth/register" className="text-indigo-400 hover:text-white transition-colors uppercase tracking-widest">Join Platform</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-bold mb-6 tracking-tighter uppercase text-xs">Legal</p>
          <ul className="space-y-4 text-[10px] font-bold text-zinc-500">
            <li><Link href="/privacy-policy" className="hover:text-white transition-colors uppercase tracking-widest">Privacy</Link></li>
            <li><Link href="/terms-of-service" className="hover:text-white transition-colors uppercase tracking-widest">Terms</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-bold mb-6 tracking-tighter uppercase text-xs">Connectivity</p>
          <ul className="space-y-4 text-[10px] font-bold text-zinc-500">
            <li><Link href="mailto:support@creatorly.link" className="hover:text-white transition-colors uppercase tracking-widest">Inquiries</Link></li>
            <li><Link href="/auth/login" className="hover:text-white transition-colors uppercase tracking-widest">Sign In</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-white font-bold mb-6 tracking-tighter uppercase text-xs">System</p>
          <div className="p-4 rounded-xl border border-white/5 bg-white/1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" aria-hidden></span>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">All Systems Operational</span>
            </div>
            <p className="text-[10px] text-zinc-600 font-medium">Recent audit available on request — contact support below.</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-xl font-black text-white tracking-tighter underline decoration-indigo-500 decoration-2 underline-offset-4">Creatorly</span>
        <div className="flex flex-col items-end gap-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">© 2026 Creatorly. All rights reserved.</p>
          <a href="mailto:hello@creatorly.com" className="text-[10px] text-zinc-500 hover:text-white">hello@creatorly.com</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
