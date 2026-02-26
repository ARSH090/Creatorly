'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import UsernameStep from './steps/UsernameStep';
import DetailsStep from './steps/DetailsStep';
import PlanStep from './steps/PlanStep';
import PaymentStep from './steps/PaymentStep';

// 4-step onboarding flow: Profile -> Store -> Plan -> Payment
const steps = [
    { id: 1, title: 'Profile' },
    { id: 2, title: 'Store' },
    { id: 3, title: 'Plan' },
    { id: 4, title: 'Payment' }
];

export default function OnboardFlow() {
    const { user, isLoaded } = useUser();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        selectedPlan: null as any,
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
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed.data }));
                setCurrentStep(parsed.step || 1);
            } catch { /* ignore */ }
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
        <div className="min-h-screen bg-white">
            <div className="max-w-md mx-auto px-6 pt-10 pb-16">
                {/* Progress Bar */}
                <div className="mb-10">
                    <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                        />
                    </div>
                </div>

                {/* Steps Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.25 }}
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
                                onChange={(updates) => setFormData(p => ({ ...p, ...updates }))}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        )}

                        {currentStep === 3 && (
                            <PlanStep
                                selectedPlan={formData.selectedPlan}
                                billingCycle={formData.billingCycle}
                                onSelect={(plan, cycle) => {
                                    setFormData(p => ({ ...p, selectedPlan: plan, billingCycle: cycle }));
                                    nextStep();
                                }}
                                onBack={prevStep}
                            />
                        )}

                        {currentStep === 4 && (
                            <PaymentStep
                                data={formData}
                                onBack={prevStep}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
