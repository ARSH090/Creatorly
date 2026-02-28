'use client';

import { useState } from 'react';
import Profile from '@/components/autodm/Profile';
import ServiceButton from '@/components/autodm/ServiceButton';
import LeadFormModal from '@/components/autodm/LeadFormModal';

export default function AutoDMHub() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState('');

    const handleButtonClick = (service: string) => {
        const serviceLabels: Record<string, string> = {
            whatsapp: 'WhatsApp Automation',
            instagram: 'Instagram DM Automation',
            telegram: 'Telegram Bot Setup',
            consultation: '1-on-1 Strategy Session'
        };
        setSelectedService(serviceLabels[service] || service);
        setModalOpen(true);
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <main className="max-w-md w-full relative z-10 px-2 sm:px-0">
                <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white/5 relative overflow-hidden">
                    {/* Inner Glow */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <Profile
                        name="AutoDM Hub"
                        bio="Premium Automation for Modern Creators"
                        imageUrl="/creatorly-logo.png"
                    />

                    <div className="space-y-3">
                        <ServiceButton service="whatsapp" label="WhatsApp Automation" onClick={handleButtonClick} />
                        <ServiceButton service="instagram" label="Instagram DM Automation" onClick={handleButtonClick} />
                        <ServiceButton service="telegram" label="Telegram Bot Setup" onClick={handleButtonClick} />
                        <ServiceButton service="consultation" label="Book a Strategy Session" onClick={handleButtonClick} />
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-4">
                        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">System Online & Active</p>
                        </div>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-tighter">© 2024 AutoDM Hub • Powered by Creatorly</p>
                    </div>
                </div>
            </main>

            <LeadFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                interest={selectedService}
            />
        </div>
    );
}
