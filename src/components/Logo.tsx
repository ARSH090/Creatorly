
import React from 'react';
import Image from 'next/image';

interface LogoProps {
    className?: string; // For the container
    iconClassName?: string; // For the icon size
    showText?: boolean;
    showTagline?: boolean;
}


export const Logo: React.FC<LogoProps> = ({
    className = "",
    iconClassName = "w-10 h-10",
    showText = true,
    showTagline = false
}) => {
    return (
        <span className={`inline-flex items-center gap-3 group ${className}`} suppressHydrationWarning>
            {showText && (
                <span className="flex flex-col">
                    <span className="text-2xl font-black italic tracking-tighter leading-none">
                        <span className="text-white">CREATOR</span>
                        <span className="text-indigo-400">LY</span>
                    </span>
                    {showTagline && (
                        <span className="text-[10px] font-medium text-zinc-500 tracking-[0.2em] uppercase mt-1 leading-none italic">
                            Monetize Your Creativity
                        </span>
                    )}
                </span>
            )}
        </span>
    );
};

export default Logo;
