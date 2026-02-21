'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import UsernameStep from './steps/UsernameStep';
import DetailsStep from './steps/DetailsStep';
import OTPStep from './steps/OTPStep';
import PlanStep from './steps/PlanStep';
import PaymentStep from './steps/PaymentStep';

const steps = [
    { id: 1, title: 'Username' },
    { id: 2, title: 'Details' },
    { id: 3, title: 'OTP' },
    { id: 4, title: 'Plan' },
    { id: 5, title: 'Payment' }
];

export default function OnboardFlow() {
    const { user, isLoaded } = useUser();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        phoneHash: '',
        selectedPlan: null,
        billingCycle: 'monthly' as 'monthly' | 'yearly',
        isGoogle: false
    });

    // Pre-fill from Clerk
    useEffect(() => {
        if (isLoaded && user) {
            setFormData(prev => ({
                ...prev,
                fullName: prev.fullName || user.fullName || '',
                email: prev.email || user.primaryEmailAddress?.emailAddress || '',
                isGoogle: user.externalAccounts.some(acc => acc.provider === 'google')
            }));
        }
    }, [isLoaded, user]);

    // Persist progress
    useEffect(() => {
        const savedData = sessionStorage.getItem('creatorly_onboarding');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setFormData(prev => ({ ...prev, ...parsed.data }));
            setCurrentStep(parsed.step || 1);
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem('creatorly_onboarding', JSON.stringify({
            step: currentStep,
            data: formData
        }));
    }, [currentStep, formData]);

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const progress = (currentStep / steps.length) * 100;

    return (
        <div className="max-w-xl mx-auto px-6 pt-12">
            {/* Progress Bar */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        Step {currentStep} of {steps.length}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {steps[currentStep - 1].title}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                </div>
            </div>

            {/* Steps Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {currentStep === 1 && (
                        <UsernameStep
                            value={formData.username}
                            onChange={(val) => setFormData(p => ({ ...p, username: val }))}
                            onNext={nextStep}
                        />
                    )}

                    {currentStep === 2 && (
                        <DetailsStep
                            data={formData}
                            onChange={(updates: Partial<typeof formData>) => setFormData(p => ({ ...p, ...updates }))}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}

                    {currentStep === 3 && (
                        <OTPStep
                            phone={formData.phone}
                            onVerified={(hash: string) => {
                                setFormData(p => ({ ...p, phoneHash: hash }));
                                nextStep();
                            }}
                            onBack={prevStep}
                        />
                    )}

                    {currentStep === 4 && (
                        <PlanStep
                            selectedPlan={formData.selectedPlan}
                            billingCycle={formData.billingCycle}
                            onSelect={(plan: any, cycle: 'monthly' | 'yearly') => {
                                setFormData(p => ({ ...p, selectedPlan: plan, billingCycle: cycle }));
                                nextStep();
                            }}
                            onBack={prevStep}
                        />
                    )}

                    {currentStep === 5 && (
                        <PaymentStep
                            data={formData}
                            onBack={prevStep}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
