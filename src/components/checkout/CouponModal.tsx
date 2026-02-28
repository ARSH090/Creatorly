'use client';

import React, { useState } from 'react';
import { X, Tag, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (code: string) => Promise<boolean>;
}

export default function CouponModal({ isOpen, onClose, onApply }: CouponModalProps) {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;

        setIsLoading(true);
        setError('');

        try {
            const success = await onApply(code);
            if (success) {
                onClose();
                setCode('');
            } else {
                setError('Invalid coupon code');
            }
        } catch (err) {
            setError('Failed to apply coupon');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                            <Tag className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Apply Coupon</h3>
                                            <p className="text-xs text-gray-500">Enter your promo code below</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-bold text-gray-900 placeholder-gray-400 uppercase tracking-widest"
                                            placeholder="Ex: WELCOME50"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            disabled={!code || isLoading}
                                            className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white rounded-lg px-4 font-bold text-xs uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                        </button>
                                    </div>
                                    {error && (
                                        <p className="text-red-500 text-xs font-medium mt-3 flex items-center gap-1 animate-in slide-in-from-top-1">
                                            <X className="w-3 h-3" /> {error}
                                        </p>
                                    )}
                                </form>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Available Offers</p>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setCode('FIRST10')}
                                            className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-gray-300 hover:border-purple-300 hover:bg-purple-50 transition-colors group text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">
                                                    %
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">FIRST10</p>
                                                    <p className="text-xs text-gray-500">10% off your first order</p>
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-purple-300">
                                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-purple-600" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
