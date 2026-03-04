'use client';

import React, { useRef, useEffect } from 'react';

interface Props {
    animation: {
        type: 'none' | 'particles' | 'floating_shapes' | 'gradient_wave' | 'falling_emojis' | 'fireflies' | 'matrix_rain' | 'bubbles' | 'confetti' | 'snow' | 'stars';
        color: string;
        secondaryColor?: string;
        speed: 'slow' | 'normal' | 'fast';
        density: 'low' | 'medium' | 'high';
        emoji?: string;
        opacity: number;
        interactive: boolean;
    };
}

export function BackgroundAnimation({ animation }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || animation.type === 'none') return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const densityVal = { low: 30, medium: 60, high: 120 }[animation.density];
        const speedMult = { slow: 0.5, normal: 1, fast: 2.5 }[animation.speed];
        const opacityHex = Math.floor(animation.opacity * 2.55).toString(16).padStart(2, '0');

        let particles: any[] = [];
        let animId: number;

        // Initialize based on type
        if (animation.type === 'particles') {
            particles = Array.from({ length: densityVal }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * speedMult,
                vy: (Math.random() - 0.5) * speedMult,
                r: Math.random() * 2 + 1,
            }));
        } else if (animation.type === 'floating_shapes') {
            particles = Array.from({ length: densityVal / 3 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 40 + 20,
                vx: (Math.random() - 0.5) * speedMult * 0.5,
                vy: (Math.random() - 0.5) * speedMult * 0.5,
                vr: (Math.random() - 0.5) * 0.02 * speedMult,
                rot: Math.random() * Math.PI * 2,
                shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
                color: Math.random() > 0.5 ? animation.color : (animation.secondaryColor || animation.color),
            }));
        } else if (animation.type === 'fireflies') {
            particles = Array.from({ length: densityVal / 2 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * speedMult * 0.8,
                vy: (Math.random() - 0.5) * speedMult * 0.8,
                r: Math.random() * 3 + 1,
                phase: Math.random() * Math.PI * 2,
            }));
        } else if (animation.type === 'falling_emojis') {
            particles = Array.from({ length: densityVal / 2 }, () => ({
                x: Math.random() * canvas.width,
                y: -50 - Math.random() * canvas.height,
                vy: (Math.random() * 2 + 1) * speedMult,
                size: Math.random() * 20 + 15,
                rot: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.05,
            }));
        } else if (animation.type === 'stars') {
            particles = Array.from({ length: densityVal * 2 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5,
                twinkle: Math.random() * 0.05 * speedMult,
                opacity: Math.random(),
            }));
        }

        let mouse = { x: -1000, y: -1000 };
        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        if (animation.interactive) window.addEventListener('mousemove', handleMouseMove);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (animation.type === 'particles') {
                particles.forEach((p, i) => {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                    if (animation.interactive) {
                        const dx = p.x - mouse.x;
                        const dy = p.y - mouse.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 100) {
                            p.x += dx / 20; p.y += dy / 20;
                        }
                    }

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = animation.color + opacityHex;
                    ctx.fill();

                    // Connections
                    for (let j = i + 1; j < particles.length; j++) {
                        const p2 = particles[j];
                        const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                        if (d < 100) {
                            ctx.beginPath();
                            ctx.strokeStyle = animation.color + Math.floor((1 - d / 100) * animation.opacity * 2.55).toString(16).padStart(2, '0');
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                });
            } else if (animation.type === 'floating_shapes') {
                particles.forEach(p => {
                    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
                    if (p.x < -100) p.x = canvas.width + 100;
                    if (p.x > canvas.width + 100) p.x = -100;
                    if (p.y < -100) p.y = canvas.height + 100;
                    if (p.y > canvas.height + 100) p.y = -100;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot);
                    ctx.globalAlpha = animation.opacity / 100;
                    ctx.fillStyle = p.color;
                    if (p.shape === 'circle') {
                        ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
                    } else if (p.shape === 'square') {
                        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    } else {
                        ctx.beginPath(); ctx.moveTo(0, -p.size / 2);
                        ctx.lineTo(p.size / 2, p.size / 2); ctx.lineTo(-p.size / 2, p.size / 2);
                        ctx.closePath(); ctx.fill();
                    }
                    ctx.restore();
                });
            } else if (animation.type === 'fireflies') {
                const t = Date.now() * 0.001;
                particles.forEach(p => {
                    p.x += p.vx + Math.sin(t + p.phase) * 0.5;
                    p.y += p.vy + Math.cos(t + p.phase * 1.5) * 0.5;
                    if (p.x < 0) p.x = canvas.width;
                    if (p.x > canvas.width) p.x = 0;
                    if (p.y < 0) p.y = canvas.height;
                    if (p.y > canvas.height) p.y = 0;

                    const pulse = (Math.sin(t * 2 + p.phase) + 1) / 2;
                    ctx.globalAlpha = pulse * animation.opacity / 100;
                    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
                    grd.addColorStop(0, animation.color);
                    grd.addColorStop(1, 'transparent');
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2); ctx.fill();
                });
            } else if (animation.type === 'falling_emojis') {
                particles.forEach(p => {
                    p.y += p.vy; p.rot += p.vr;
                    if (p.y > canvas.height + 50) {
                        p.y = -50; p.x = Math.random() * canvas.width;
                    }
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot);
                    ctx.globalAlpha = animation.opacity / 100;
                    ctx.font = `${p.size}px serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(animation.emoji || '✨', 0, 0);
                    ctx.restore();
                });
            } else if (animation.type === 'stars') {
                particles.forEach(p => {
                    p.opacity += p.twinkle;
                    if (p.opacity > 1 || p.opacity < 0) p.twinkle *= -1;
                    ctx.globalAlpha = p.opacity * (animation.opacity / 100);
                    ctx.fillStyle = animation.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
                });
            }

            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
            if (animation.interactive) window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [animation]);

    if (animation.type === 'none') return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
}
