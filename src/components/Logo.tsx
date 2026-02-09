
import React from 'react';
import Image from 'next/image';

interface LogoProps {
    className?: string; // For the container
    iconClassName?: string; // For the icon size
    showText?: boolean;
}


export const Logo: React.FC<LogoProps> = ({ className = "", iconClassName = "w-8 h-8", showText = true }) => {
    return (
        <div className={`flex items-center gap-3 group ${className}`}>
            <div className={`relative overflow-hidden ${iconClassName} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                <Image
                    src="/creatorly-logo.png"
                    alt="Creatorly Logo"
                    width={120}
                    height={40}
                    className="object-contain"
                    priority
                />
            </div>

            {showText && (
                <span className="text-xl font-black text-white tracking-tighter uppercase italic">
                    Creator<span className="text-indigo-400">ly</span>
                </span>
            )}
        </div>
    );
};

export default Logo;
