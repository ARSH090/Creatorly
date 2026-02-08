import React from 'react';

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white py-20 px-4">
            <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 p-8 md:p-12 rounded-3xl backdrop-blur-xl">
                <div className="prose prose-invert prose-orange max-w-none">
                    {children}
                </div>
                <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
                    <p className="text-zinc-500 text-sm">
                        &copy; {new Date().getFullYear()} Creatorly. In compliance with Indian IT Act 2000 & RBI Guidelines.
                    </p>
                </div>
            </div>
        </div>
    );
}
