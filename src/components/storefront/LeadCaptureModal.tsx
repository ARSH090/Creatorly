import React, { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import type { StorefrontTheme, LeadSubmitStatus } from '@/types/storefront.types';
import { primaryWithOpacity, getBorderRadiusClass } from '@/utils/theme.utils';
import { useLeadStore } from '@/lib/store/useLeadStore';

// ─── Validation Schema ────────────────────────────────────────────────────────

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z
        .string()
        .min(10, 'Enter a valid phone number')
        .max(15, 'Phone number too long')
        .regex(/^\+?[1-9]\d{6,14}$/, 'Use international format: +91XXXXXXXXXX'),
    email: z.string().email('Invalid email').or(z.literal('')).optional(),
    interest: z.string(),
    productId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getReferralCode(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const match = document.cookie.match(/(?:^|;\s*)(?:referral_code|affiliate_ref)=([^;]+)/);
    return match?.[1] || undefined;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
    id,
    label,
    required,
    error,
    primaryColor,
    ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
    id: string;
    label: string;
    required?: boolean;
    error?: string;
    primaryColor: string;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest opacity-60">
                {label} {required && <span className="text-rose-400">*</span>}
            </label>
            <input
                id={id}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10
                           placeholder-white/20 outline-none
                           focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]
                           transition-colors"
                style={{ '--primary': primaryColor } as React.CSSProperties}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                {...rest}
            />
            {error && (
                <p id={`${id}-error`} className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeadCaptureModalProps {
    creatorUsername: string;
    theme: StorefrontTheme;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadCaptureModal({
    creatorUsername,
    theme,
}: LeadCaptureModalProps) {
    const { isOpen, source, closeLeadModal } = useLeadStore();
    const [status, setStatus] = useState<LeadSubmitStatus>('idle');
    const [deepLink, setDeepLink] = useState<string | null>(null);
    const [autoSend, setAutoSend] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);

    const radiusClass = getBorderRadiusClass(theme.buttonStyle);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            interest: '',
            productId: ''
        },
    });

    // Sync interest field with the source
    useEffect(() => {
        if (isOpen && source) { // Added isOpen check to prevent setting on initial render if not open
            setValue('interest', source.label);
            if (source.productId) {
                setValue('productId', source.productId);
            }
        }
    }, [isOpen, source, setValue]); // Added isOpen to dependencies

    // Reset entire modal state when it closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                reset();
                setStatus('idle');
                setDeepLink(null);
                setAutoSend(null);
                setServerError(null);
            }, 300); // wait for close animation
        }
    }, [isOpen, reset]);

    const onSubmit: SubmitHandler<FormValues> = useCallback(
        async (values) => {
            setStatus('loading');
            setServerError(null);

            const referredBy = getReferralCode();
            const payload = {
                ...values,
                creatorUsername,
                ...(referredBy ? { referredBy } : {}),
            };

            try {
                const res = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Submission failed. Please try again.');
                }

                setDeepLink(data.data?.deepLink ?? null);
                setAutoSend(data.data?.autoSend ?? null);
                setStatus('success');
            } catch (err: any) {
                setServerError(err.message || 'Something went wrong. Please try again.');
                setStatus('error');
            }
        },
        [creatorUsername]
    );

    return (
        <Dialog.Root open={isOpen} onOpenChange={(o) => !o && closeLeadModal()}>
            <Dialog.Portal>
                {/* Backdrop */}
                <Dialog.Overlay asChild>
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                </Dialog.Overlay>

                {/* Panel */}
                <Dialog.Content
                    data-testid="lead-modal"
                    aria-describedby="modal-description"
                    className="fixed z-50 inset-0 flex items-end sm:items-center justify-center p-4 sm:p-0"
                    onEscapeKeyDown={closeLeadModal}
                    onInteractOutside={closeLeadModal}
                >
                    <motion.div
                        className="relative w-full sm:max-w-md rounded-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            backgroundColor: theme.backgroundColor === '#030303'
                                ? '#111111'
                                : theme.backgroundColor,
                            color: theme.textColor,
                            border: `1px solid ${primaryWithOpacity(theme.primaryColor, 0.2)}`,
                        }}
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 py-5 border-b"
                            style={{ borderColor: primaryWithOpacity(theme.primaryColor, 0.15) }}
                        >
                            <div>
                                <Dialog.Title className="text-base font-bold">
                                    {source?.label ?? 'Get in Touch'}
                                </Dialog.Title>
                                <p id="modal-description" className="text-xs opacity-50 mt-0.5">
                                    Fill in your details and we&apos;ll reach out shortly.
                                </p>
                            </div>
                            <Dialog.Close asChild>
                                <button
                                    data-testid="modal-close"
                                    aria-label="Close modal"
                                    className="w-8 h-8 rounded-full flex items-center justify-center
                                               bg-white/5 hover:bg-white/10 transition-colors"
                                    onClick={closeLeadModal}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </Dialog.Close>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6">
                            <AnimatePresence mode="wait">
                                {/* ── Idle / Error: Form ── */}
                                {(status === 'idle' || status === 'error') && (
                                    <motion.form
                                        key="form"
                                        onSubmit={handleSubmit(onSubmit)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        noValidate
                                        className="space-y-4"
                                    >
                                        <InputField
                                            id="lead-name"
                                            label="Your Name"
                                            placeholder="e.g. Arsh Sharma"
                                            required
                                            primaryColor={theme.primaryColor}
                                            error={errors.name?.message}
                                            {...register('name')}
                                        />
                                        <InputField
                                            id="lead-phone"
                                            label="WhatsApp Number"
                                            placeholder="+91 98765 43210"
                                            type="tel"
                                            required
                                            primaryColor={theme.primaryColor}
                                            error={errors.phone?.message}
                                            {...register('phone')}
                                        />
                                        <InputField
                                            id="lead-email"
                                            label="Email (optional)"
                                            placeholder="you@email.com"
                                            type="email"
                                            primaryColor={theme.primaryColor}
                                            error={errors.email?.message}
                                            {...register('email')}
                                        />

                                        {/* Hidden fields */}
                                        <input type="hidden" {...register('interest')} />
                                        <input type="hidden" {...register('productId')} />

                                        {/* Server error banner */}
                                        {status === 'error' && serverError && (
                                            <div
                                                role="alert"
                                                aria-live="assertive"
                                                className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm bg-rose-500/10 border border-rose-500/20 text-rose-400"
                                            >
                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>{serverError}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            data-testid="lead-submit-btn"
                                            className={`w-full py-3.5 font-bold text-sm text-white transition-all
                                                       hover:opacity-90 active:scale-95 mt-2 ${radiusClass}`}
                                            style={{
                                                backgroundColor: theme.primaryColor,
                                                boxShadow: `0 8px 24px ${primaryWithOpacity(theme.primaryColor, 0.35)}`,
                                            }}
                                        >
                                            {status === 'error' ? 'Try Again' : 'Submit & Connect'}
                                        </button>
                                    </motion.form>
                                )}

                                {/* ── Loading ── */}
                                {status === 'loading' && (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-12 space-y-4"
                                        aria-live="polite"
                                        aria-label="Submitting your details"
                                    >
                                        <Loader2
                                            className="w-10 h-10 animate-spin"
                                            style={{ color: theme.primaryColor }}
                                        />
                                        <p className="text-sm font-medium opacity-60">Sending your details…</p>
                                    </motion.div>
                                )}

                                {/* ── Success ── */}
                                {status === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center text-center py-8 space-y-4"
                                        aria-live="polite"
                                    >
                                        <span
                                            className="w-16 h-16 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: primaryWithOpacity(theme.primaryColor, 0.15) }}
                                        >
                                            <CheckCircle2
                                                className="w-8 h-8"
                                                style={{ color: theme.primaryColor }}
                                            />
                                        </span>

                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold">You&apos;re all set! 🎉</h3>
                                            <p className="text-sm opacity-60">
                                                {autoSend === 'queued'
                                                    ? 'A message has been sent to your WhatsApp.'
                                                    : "We've received your details. Expect a message soon!"}
                                            </p>
                                        </div>

                                        {/* WhatsApp Deep-link (shown when auto-send is disabled) */}
                                        {deepLink && autoSend !== 'queued' && (
                                            <a
                                                href={deepLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                data-testid="whatsapp-link"
                                                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm text-white
                                                           transition-all hover:opacity-90 active:scale-95 ${radiusClass}`}
                                                style={{ backgroundColor: '#25D366' }}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Open WhatsApp Chat
                                            </a>
                                        )}

                                        <button
                                            onClick={closeLeadModal}
                                            className="text-xs opacity-40 hover:opacity-70 transition-opacity underline"
                                        >
                                            Close
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
