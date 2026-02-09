
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
            <div className={`relative overflow-hidden rounded-lg ${iconClassName} flex items-center justify-center`}> 
                {/* Prefer raster logo if available in public/assets, otherwise fallback to SVG */}
                {/* Place the attached image at public/assets/creatorly-logo.png for the raster logo to show */}
                <Image
                    src="/assets/creatorly-logo.png"
                    alt="Creatorly logo"
                    width={64}
                    height={64}
                    className="object-contain"
                    onError={() => { /* graceful fallback handled by browser */ }}
                />
            </div>

            {showText && (
                <span className="text-xl font-bold text-white tracking-tight">Creatorly</span>
            )}
        </div>
    );
};

export default Logo;
