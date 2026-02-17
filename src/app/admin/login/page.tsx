'use client';

import { SignIn } from "@clerk/nextjs";

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

            <div className="relative z-10">
                <div className="mb-8 text-center">
                    <div className="text-4xl font-bold text-white">
                        Creatorly <span className="text-purple-400">Admin</span>
                    </div>
                    <p className="text-gray-300 mt-2">Sign in to manage the platform</p>
                </div>

                <SignIn fallbackRedirectUrl="/admin" />
            </div>
        </div>
    );
}
