'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, LeadInput } from '@/lib/validation/leadSchema';
import { LeadResponse } from '@/types/lead';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    interest: string;
}

export default function LeadFormModal({ isOpen, onClose, interest }: LeadFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [deepLink, setDeepLink] = useState('');
    const [autoSend, setAutoSend] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<LeadInput>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            interest: interest,
        },
    });

    const onSubmit = async (data: LeadInput) => {
        setLoading(true);
        setSubmitError(null);
        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result: any = await res.json();
            if (result.success) {
                setSuccess(true);
                setDeepLink(result.data.deepLink);
                setAutoSend(result.data.autoSend === 'queued');
                reset();
            } else {
                setSubmitError(result.message || 'Failed to save lead');
            }
        } catch (err) {
            setSubmitError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setSuccess(false);
            setDeepLink('');
            setAutoSend(false);
            setSubmitError(null);
        }, 500);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={handleClose}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            />
                        </Dialog.Overlay>
                        <Dialog.Content asChild>
                            <motion.div
                                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] p-8 z-[101] shadow-2xl overflow-hidden"
                                initial={{ opacity: 0, scale: 0.9, y: '-45%', x: '-50%' }}
                                animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
                                exit={{ opacity: 0, scale: 0.9, y: '-45%', x: '-50%' }}
                            >
                                {/* Accent Glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

                                <div className="relative">
                                    {!success ? (
                                        <>
                                            <div className="mb-8">
                                                <Dialog.Title className="text-2xl font-black text-white mb-2 leading-tight">
                                                    Get Started with <br />
                                                    <span className="text-indigo-400 font-black">{interest}</span>
                                                </Dialog.Title>
                                                <Dialog.Description className="text-zinc-400 text-sm font-medium">
                                                    Leave your details and we'll get back to you instantly.
                                                </Dialog.Description>
                                            </div>

                                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                                                        <div className="relative group">
                                                            <input
                                                                {...register('name')}
                                                                placeholder="Your Name"
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                                                            />
                                                        </div>
                                                        {errors.name && (
                                                            <p className="text-[10px] font-bold text-red-400 ml-1">{errors.name.message}</p>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
                                                            <input
                                                                {...register('email')}
                                                                type="email"
                                                                placeholder="name@company.com"
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                                                            />
                                                            {errors.email && (
                                                                <p className="text-[10px] font-bold text-red-400 ml-1">{errors.email.message}</p>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Phone Number</label>
                                                            <input
                                                                {...register('phone')}
                                                                placeholder="+91 XXXXX XXXXX"
                                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                                                            />
                                                            {errors.phone && (
                                                                <p className="text-[10px] font-bold text-red-400 ml-1">{errors.phone.message}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <input type="hidden" {...register('interest')} value={interest} />

                                                {submitError && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold"
                                                    >
                                                        <AlertCircle className="w-4 h-4" />
                                                        {submitError}
                                                    </motion.div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                                >
                                                    {loading ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            Submit Interest
                                                            <motion.span
                                                                animate={{ x: [0, 5, 0] }}
                                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                            >
                                                                →
                                                            </motion.span>
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <div className="py-6 flex flex-col items-center text-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6"
                                            >
                                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                            </motion.div>
                                            <h3 className="text-2xl font-black text-white mb-2 leading-tight">Interest Received!</h3>
                                            <p className="text-zinc-400 text-sm font-medium mb-8">
                                                {autoSend
                                                    ? "Our assistant will message you on WhatsApp shortly."
                                                    : "Our team will reach out to you within the next 24 hours."
                                                }
                                            </p>

                                            {deepLink && (
                                                <motion.a
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    href={deepLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                                >
                                                    <Send className="w-5 h-5" />
                                                    Open WhatsApp Now
                                                </motion.a>
                                            )}
                                        </div>
                                    )}

                                    <Dialog.Close asChild>
                                        <button
                                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                                            aria-label="Close"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </Dialog.Close>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
}
