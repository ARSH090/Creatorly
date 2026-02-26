'use client';

import React, { useState } from 'react';
import {
    ChevronLeft, ChevronRight, Save, Clock, IndianRupee,
    Globe, Mail, Shield, Zap, Plus, Trash2, Video,
    Phone, MapPin, User, FileText, Settings, Star, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STEPS = [
    { id: 1, name: 'Basics', icon: FileText },
    { id: 2, name: 'Duration & Price', icon: Clock },
    { id: 3, name: 'Availability', icon: Settings },
    { id: 4, name: 'Location', icon: MapPin },
    { id: 5, name: 'Questions', icon: User },
    { id: 6, name: 'Notifications', icon: Mail },
    { id: 7, name: 'Policy', icon: Shield },
    { id: 8, name: 'Review', icon: Zap },
];

export default function NewServicePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<any>({
        name: '',
        description: '',
        category: 'Coaching',
        duration: 30,
        pricingType: 'fixed',
        price: 0,
        currency: 'INR',
        paymentTiming: 'pay_now',
        bufferBefore: 0,
        bufferAfter: 0,
        useGlobalAvailability: true,
        meetingType: 'google_meet',
        meetingLink: '',
        customFields: [],
        reminders: [
            { id: '1', timingHoursBefore: 24, methods: ['email'], message: '' },
            { id: '2', timingHoursBefore: 1, methods: ['email', 'whatsapp'], message: '' }
        ],
        allowCancellation: true,
        deadlineHours: 24,
        refundPolicy: 'full',
        allowReschedule: true
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSave = async () => {
        setIsSaving(true);
        // Implement save logic to /api/schedulify/services
        setTimeout(() => {
            setIsSaving(false);
            router.push('/dashboard/schedulify/services');
        }, 1500);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Service Name</label>
                            <input
                                type="text"
                                placeholder="e.g. 1:1 Growth Strategy Call"
                                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Description</label>
                            <textarea
                                rows={4}
                                placeholder="What will happen in this session?"
                                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Category</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option>Coaching</option>
                                    <option>Consulting</option>
                                    <option>Tutoring</option>
                                    <option>Fitness</option>
                                    <option>Technical</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Internal Notes</label>
                                <input
                                    type="text"
                                    placeholder="Only visible to you"
                                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-8">
                        {/* Duration Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-400" />
                                Session Duration
                            </h4>
                            <div className="grid grid-cols-4 gap-3">
                                {[15, 30, 45, 60, 90, 120].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => setFormData({ ...formData, duration: mins })}
                                        className={`py-3 rounded-xl border font-bold text-xs transition-all ${formData.duration === mins
                                                ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                : 'bg-black border-white/10 text-zinc-500 hover:border-white/20'
                                            }`}
                                    >
                                        {mins} Min
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Buffer Section */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Prep Time (Before)</label>
                                <select className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm">
                                    <option>None</option>
                                    <option>5 mins</option>
                                    <option>10 mins</option>
                                    <option>15 mins</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recovery Time (After)</label>
                                <select className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm">
                                    <option>None</option>
                                    <option>5 mins</option>
                                    <option>10 mins</option>
                                    <option>15 mins</option>
                                </select>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <IndianRupee className="w-4 h-4 text-emerald-400" />
                                Pricing & Payments
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setFormData({ ...formData, pricingType: 'free' })}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${formData.pricingType === 'free' ? 'bg-emerald-500/5 border-emerald-500/50' : 'bg-black border-white/10'
                                        }`}
                                >
                                    <p className="font-bold text-white text-sm">Free</p>
                                    <p className="text-[10px] text-zinc-500 mt-1">No payment required to book.</p>
                                </div>
                                <div
                                    onClick={() => setFormData({ ...formData, pricingType: 'fixed' })}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${formData.pricingType === 'fixed' ? 'bg-indigo-500/5 border-indigo-500/50' : 'bg-black border-white/10'
                                        }`}
                                >
                                    <p className="font-bold text-white text-sm">Paid</p>
                                    <p className="text-[10px] text-zinc-500 mt-1">Fixed price for the session.</p>
                                </div>
                            </div>

                            {formData.pricingType === 'fixed' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</div>
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            className="w-full bg-black border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-white focus:border-emerald-500/50 outline-none"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-white mb-2">Payment Timing</p>
                                            <select className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs w-full">
                                                <option>Pay now (Fully prepaid)</option>
                                                <option>Pay later (At session)</option>
                                                <option>Deposit first</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-white">Global Availability</p>
                                <p className="text-xs text-zinc-500 mt-1">Use your default working hours and schedule.</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-indigo-500">
                                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-sm font-bold text-white">Booking Limits</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Minimum Notice</label>
                                    <select className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm">
                                        <option>2 hours</option>
                                        <option>12 hours</option>
                                        <option>24 hours</option>
                                        <option>48 hours</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Max Advance Booking</label>
                                    <select className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-sm">
                                        <option>1 month</option>
                                        <option>2 months</option>
                                        <option>No limit</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'zoom', name: 'Zoom Video', icon: Video, desc: 'Auto-generates meeting link' },
                                { id: 'google_meet', name: 'Google Meet', icon: Globe, desc: 'Add your custom meet link' },
                                { id: 'phone', name: 'Phone Call', icon: Phone, desc: 'You call the client' },
                                { id: 'in_person', name: 'In Person', icon: MapPin, desc: 'Meet at a physical location' },
                            ].map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => setFormData({ ...formData, meetingType: type.id })}
                                    className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center gap-4 ${formData.meetingType === type.id
                                            ? 'bg-indigo-500/10 border-indigo-500/50'
                                            : 'bg-black border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className={`p-3 rounded-2xl ${formData.meetingType === type.id ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <type.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{type.name}</p>
                                        <p className="text-[10px] text-zinc-500">{type.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {formData.meetingType === 'google_meet' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Meet Link</label>
                                <input
                                    type="text"
                                    placeholder="meet.google.com/xxx-xxxx-xxx"
                                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500"
                                    value={formData.meetingLink}
                                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3 text-xs text-zinc-400 leading-relaxed">
                            <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <p>Name and Email are always collected. You can add up to 10 additional questions to gather info before the call.</p>
                        </div>

                        <div className="space-y-4">
                            {formData.customFields.map((field: any, index: number) => (
                                <div key={index} className="bg-black border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">{field.label}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{field.type}</p>
                                    </div>
                                    <button className="p-2 text-zinc-600 hover:text-red-400">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-zinc-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm font-bold">
                                <Plus className="w-4 h-4" />
                                Add Custom Question
                            </button>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-8">
                        <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                Immediate Confirmation
                            </h4>
                            <p className="text-xs text-zinc-500 mb-6">Sent automatically as soon as a booking is confirmed.</p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-black rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-indigo-400" />
                                        <span className="text-sm font-medium text-white">Email Confirmation</span>
                                    </div>
                                    <div className="h-5 w-10 bg-indigo-500 rounded-full relative">
                                        <div className="absolute right-0.5 top-0.5 h-4 w-4 bg-white rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-white mb-4">Upcoming Reminders</h4>
                            <div className="space-y-4">
                                {formData.reminders.map((reminder: any) => (
                                    <div key={reminder.id} className="p-5 bg-black border border-white/5 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Clock className="w-5 h-5 text-zinc-500" />
                                            <div>
                                                <p className="text-xs font-bold text-white">{reminder.timingHoursBefore} hours before</p>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                                                    {reminder.methods.join(' & ')}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="text-[10px] font-bold text-indigo-400">Edit</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="space-y-6">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 text-center">
                            <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                                <Star className="w-10 h-10 text-white fill-white" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Ready to Launch!</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto mb-8">Review your package settings. Once published, you can share the link with your audience.</p>
                        </div>

                        <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">Service</span>
                                <span className="text-white font-bold">{formData.name || 'Unnamed Service'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">Price</span>
                                <span className="text-white font-bold">₹{formData.price}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">Duration</span>
                                <span className="text-white font-bold">{formData.duration} mins</span>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/schedulify/services" className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-zinc-500 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white">Create New Service</h1>
                        <p className="text-sm text-zinc-500">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-white text-black px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg shadow-white/5"
                >
                    {isSaving ? <Loader /> : (
                        <>
                            <Save className="w-4 h-4" />
                            Publish Service
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stepper Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    {STEPS.map((step) => (
                        <div
                            key={step.id}
                            onClick={() => setCurrentStep(step.id)}
                            className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${currentStep === step.id
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : currentStep > step.id
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                        : 'bg-transparent text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg ${currentStep === step.id ? 'bg-white/20' : 'bg-transparent'}`}>
                                <step.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold">{step.name}</span>
                        </div>
                    ))}
                </div>

                {/* Form Content */}
                <div className="lg:col-span-3">
                    <div className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 p-10 min-h-[500px] flex flex-col shadow-2xl shadow-indigo-500/5">
                        <div className="flex-1">
                            {renderStep()}
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="px-6 py-3 text-zinc-500 hover:text-white font-bold transition-all disabled:opacity-30 flex items-center gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            {currentStep < STEPS.length ? (
                                <button
                                    onClick={nextStep}
                                    className="bg-zinc-800 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-700 transition-all border border-white/5"
                                >
                                    Continue <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    className="bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20"
                                >
                                    Publish Now
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Loader() {
    return (
        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
    );
}
