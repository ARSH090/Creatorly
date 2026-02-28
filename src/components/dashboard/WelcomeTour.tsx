'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step {
    title: string;
    description: string;
    target?: string;
}

interface WelcomeTourProps {
    run: boolean;
    onClose: () => void;
}

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ run, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (run) {
            setIsVisible(true);
        }
    }, [run]);

    const steps: Step[] = [
        {
            title: "Welcome to Creatorly! 🚀",
            description: "Your high-performance dashboard is ready. Let's take a quick look at how to maximize your growth.",
        },
        {
            title: "Real-Time Analytics",
            description: "Monitor your revenue, visitors, and repeat customers with live data updates.",
            target: "stats-grid",
        },
        {
            title: "Usage Transparency",
            description: "Keep an eye on your AI generation and storage limits. No surprises, just growth.",
            target: "usage-meters",
        },
        {
            title: "Quick Actions",
            description: "Create new projects or upgrade your plan instantly using these shortcuts.",
            target: "quick-actions",
        },
    ];

    if (!isVisible) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 blur-[80px] rounded-full" />

                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                            <Zap className="w-6 h-6 text-indigo-400" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">{steps[currentStep].title}</h3>
                        <p className="text-zinc-400 leading-relaxed mb-8">
                            {steps[currentStep].description}
                        </p>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-6 bg-indigo-500' : 'w-2 bg-zinc-800'}`}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-3">
                                {currentStep > 0 && (
                                    <button
                                        onClick={handleBack}
                                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="bg-white text-black px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                                >
                                    {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
