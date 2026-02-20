/**
 * Theme utility functions for the AutoDM Hub storefront.
 * Pure functions — all are unit-testable without DOM or React.
 */

import type { StorefrontTheme, ServiceType } from '@/types/storefront.types';
import type React from 'react';

// ─── CSS Variable Mapping ─────────────────────────────────────────────────────

/**
 * Converts a StorefrontTheme into a React inline style object
 * with CSS custom properties that cascade down the component tree.
 */
export function applyThemeToCSSVars(theme: StorefrontTheme): React.CSSProperties {
    return {
        '--primary': theme.primaryColor,
        '--secondary': theme.secondaryColor,
        '--accent': theme.accentColor,
        '--bg': theme.backgroundColor,
        '--text': theme.textColor,
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: `'${theme.fontFamily}', system-ui, sans-serif`,
        ...(theme.backgroundImage && {
            backgroundImage: `url(${theme.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
        })
    } as React.CSSProperties;
}

// ─── Icon Mapping ─────────────────────────────────────────────────────────────

/** Lucide icon name for each service type */
const SERVICE_ICON_MAP: Record<ServiceType | 'default', string> = {
    whatsapp: 'MessageCircle',
    instagram: 'Camera',
    youtube: 'Play',
    email: 'Mail',
    booking: 'Calendar',
    telegram: 'Send',
    twitter: 'Twitter',
    linkedin: 'Linkedin',
    tiktok: 'Music2',
    custom: 'ExternalLink',
    default: 'ExternalLink',
};

export function getIconNameForServiceType(serviceType: string): string {
    return SERVICE_ICON_MAP[serviceType as ServiceType] ?? SERVICE_ICON_MAP.default;
}

// ─── Border Radius Mapping ────────────────────────────────────────────────────

const BUTTON_STYLE_RADIUS: Record<string, string> = {
    pill: 'rounded-full',
    rounded: 'rounded-2xl',
    square: 'rounded-md',
};

export function getBorderRadiusClass(buttonStyle: string): string {
    return BUTTON_STYLE_RADIUS[buttonStyle] ?? 'rounded-2xl';
}

// ─── Theme Border Radius Mapping ──────────────────────────────────────────────

const THEME_RADIUS: Record<string, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-xl',
    full: 'rounded-full',
};

export function getThemeBorderRadiusClass(borderRadius: string): string {
    return THEME_RADIUS[borderRadius] ?? 'rounded-2xl';
}

// ─── Google Fonts URL ─────────────────────────────────────────────────────────

const GOOGLE_FONTS_FAMILIES = [
    'Inter', 'Roboto', 'Outfit', 'Poppins', 'DM Sans',
    'Nunito', 'Raleway', 'Montserrat', 'Playfair Display', 'Space Grotesk',
];

/**
 * Returns a Google Fonts URL for use in <link href="..."> if the font
 * is in the known list. Returns null for system fonts.
 */
export function getGoogleFontsUrl(fontFamily: string): string | null {
    if (!GOOGLE_FONTS_FAMILIES.includes(fontFamily)) return null;
    const encoded = fontFamily.replace(/ /g, '+');
    return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800;900&display=swap`;
}

// ─── Colour Helpers ───────────────────────────────────────────────────────────

/** Returns the primary colour at a given opacity (0–1) as rgba string */
export function primaryWithOpacity(hex: string, opacity: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
