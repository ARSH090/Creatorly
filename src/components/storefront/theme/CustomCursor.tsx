'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
    cursor: {
        type: 'default' | 'dot' | 'ring' | 'blob' | 'emoji' | 'crosshair' | 'none';
        color: string;
        size: number;
        emoji?: string;
        trailEffect: boolean;
        trailColor?: string;
        trailLength: number;
        magneticButtons: boolean;
    };
}

export function CustomCursor({ cursor }: Props) {
    const [pos, setPos] = useState({ x: -100, y: -100 });
    const [isHovering, setIsHovering] = useState(false);
    const [trail, setTrail] = useState<{ x: number, y: number, id: number }[]>([]);

    useEffect(() => {
        if (cursor.type === 'default') return;

        const moveMove = (e: MouseEvent) => {
            setPos({ x: e.clientX, y: e.clientY });

            if (cursor.trailEffect) {
                setTrail(prev => [
                    { x: e.clientX, y: e.clientY, id: Date.now() },
                    ...prev.slice(0, (cursor.trailLength || 5) - 1)
                ]);
            }
        };

        const mouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('a') !== null ||
                target.closest('button') !== null ||
                target.classList.contains('cursor-pointer');

            setIsHovering(isClickable);
        };

        window.addEventListener('mousemove', moveMove);
        window.addEventListener('mouseover', mouseOver);

        return () => {
            window.removeEventListener('mousemove', moveMove);
            window.removeEventListener('mouseover', mouseOver);
        };
    }, [cursor]);

    if (cursor.type === 'default') return null;

    return (
        <>
            <style jsx global>{`
                * {
                }
            `}</style>

            {/* Trail */}
            {cursor.trailEffect && trail.map((p, i) => (
                <div
                    key={p.id}
                    className="fixed pointer-events-none z-[99998] transition-transform duration-75"
                    style={{
                        left: p.x,
                        top: p.y,
                        width: (cursor.size * 0.4) * (1 - i / trail.length),
                        height: (cursor.size * 0.4) * (1 - i / trail.length),
                        backgroundColor: cursor.trailColor || cursor.color,
                        borderRadius: '50%',
                        opacity: (1 - i / trail.length) * 0.5,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}

            {/* Main Cursor */}
            <motion.div
                className="fixed pointer-events-none z-[99999] flex items-center justify-center overflow-hidden"
                animate={{
                    x: pos.x,
                    y: pos.y,
                    scale: isHovering ? 1.5 : 1,
                    width: cursor.size,
                    height: cursor.size,
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.5 }}
                style={{
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: cursor.type === 'dot' ? cursor.color : 'transparent',
                    border: cursor.type === 'ring' ? `2px solid ${cursor.color}` : 'none',
                    borderRadius: cursor.type === 'blob' ? '40% 60% 70% 30% / 40% 40% 60% 60%' : (cursor.type === 'crosshair' ? '0' : '50%'),
                    backdropFilter: cursor.type === 'blob' ? 'blur(4px)' : 'none',
                    fontSize: cursor.type === 'emoji' ? `${cursor.size}px` : undefined,
                }}
            >
                {cursor.type === 'emoji' && cursor.emoji}
                {cursor.type === 'crosshair' && (
                    <div className="relative w-full h-full">
                        <div className="absolute top-1/2 left-0 w-full h-[1px]" style={{ backgroundColor: cursor.color }} />
                        <div className="absolute left-1/2 top-0 h-full w-[1px]" style={{ backgroundColor: cursor.color }} />
                    </div>
                )}
                {cursor.type === 'blob' && (
                    <div
                        className="absolute inset-0 opacity-40 animate-pulse"
                        style={{ background: `radial-gradient(circle, ${cursor.color}, transparent)` }}
                    />
                )}
            </motion.div>
        </>
    );
}
