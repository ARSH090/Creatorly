
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
        <div className={`flex items-center gap-3 group ${className}`}>
            <div className={`relative ${iconClassName} flex items-center justify-center transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-110`}>
                <Image
                    src="/logo.png"
                    alt="Creatorly"
                    width={120}
                    height={120}
                    className="object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                    priority
                />
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-tighter text-brand-gradient leading-none">
                        CREATORLY
                    </span>
                    {showTagline && (
                        <span className="text-[10px] font-medium text-zinc-500 tracking-[0.2em] uppercase mt-1 leading-none">
                            Monetize Your Creativity
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default Logo;
