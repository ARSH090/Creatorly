/**
 * Unit tests for theme.utils.ts
 * Run: npx vitest run src/utils/theme.utils.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
    applyThemeToCSSVars,
    getIconNameForServiceType,
    getBorderRadiusClass,
    getThemeBorderRadiusClass,
    getGoogleFontsUrl,
    primaryWithOpacity,
} from './theme.utils';
import type { StorefrontTheme } from '@/types/storefront.types';

const MOCK_THEME: StorefrontTheme = {
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7',
    accentColor: '#ec4899',
    backgroundColor: '#030303',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    borderRadius: 'md',
    buttonStyle: 'rounded',
};

// ─── applyThemeToCSSVars ──────────────────────────────────────────────────────

describe('applyThemeToCSSVars', () => {
    it('maps primaryColor to --primary CSS variable', () => {
        const vars = applyThemeToCSSVars(MOCK_THEME) as Record<string, string>;
        expect(vars['--primary']).toBe('#6366f1');
    });

    it('maps backgroundColor to --bg and inline style', () => {
        const vars = applyThemeToCSSVars(MOCK_THEME) as Record<string, string>;
        expect(vars['--bg']).toBe('#030303');
        expect(vars['backgroundColor']).toBe('#030303');
    });

    it('includes fontFamily with fallbacks', () => {
        const vars = applyThemeToCSSVars(MOCK_THEME) as Record<string, string>;
        expect(vars['fontFamily']).toContain('Inter');
        expect(vars['fontFamily']).toContain('system-ui');
    });

    it('maps all five CSS variables', () => {
        const vars = applyThemeToCSSVars(MOCK_THEME) as Record<string, string>;
        expect(vars).toHaveProperty('--primary');
        expect(vars).toHaveProperty('--secondary');
        expect(vars).toHaveProperty('--accent');
        expect(vars).toHaveProperty('--bg');
        expect(vars).toHaveProperty('--text');
    });
});

// ─── getIconNameForServiceType ────────────────────────────────────────────────

describe('getIconNameForServiceType', () => {
    const EXPECTED: Record<string, string> = {
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
    };

    Object.entries(EXPECTED).forEach(([type, icon]) => {
        it(`returns '${icon}' for serviceType '${type}'`, () => {
            expect(getIconNameForServiceType(type)).toBe(icon);
        });
    });

    it('falls back to ExternalLink for unknown service types', () => {
        expect(getIconNameForServiceType('unknown_service')).toBe('ExternalLink');
        expect(getIconNameForServiceType('')).toBe('ExternalLink');
    });
});

// ─── getBorderRadiusClass ─────────────────────────────────────────────────────

describe('getBorderRadiusClass', () => {
    it('returns rounded-full for pill', () => {
        expect(getBorderRadiusClass('pill')).toBe('rounded-full');
    });

    it('returns rounded-2xl for rounded', () => {
        expect(getBorderRadiusClass('rounded')).toBe('rounded-2xl');
    });

    it('returns rounded-md for square', () => {
        expect(getBorderRadiusClass('square')).toBe('rounded-md');
    });

    it('falls back to rounded-2xl for unknown values', () => {
        expect(getBorderRadiusClass('unknown')).toBe('rounded-2xl');
    });
});

// ─── getThemeBorderRadiusClass ────────────────────────────────────────────────

describe('getThemeBorderRadiusClass', () => {
    it('returns rounded-sm for sm', () => {
        expect(getThemeBorderRadiusClass('sm')).toBe('rounded-sm');
    });
    it('returns rounded-xl for lg', () => {
        expect(getThemeBorderRadiusClass('lg')).toBe('rounded-xl');
    });
    it('returns rounded-full for full', () => {
        expect(getThemeBorderRadiusClass('full')).toBe('rounded-full');
    });
    it('falls back for unknown values', () => {
        expect(getThemeBorderRadiusClass('nope')).toBe('rounded-2xl');
    });
});

// ─── getGoogleFontsUrl ────────────────────────────────────────────────────────

describe('getGoogleFontsUrl', () => {
    it('returns a Google Fonts URL for Inter', () => {
        const url = getGoogleFontsUrl('Inter');
        expect(url).not.toBeNull();
        expect(url).toContain('fonts.googleapis.com');
        expect(url).toContain('Inter');
    });

    it('returns a URL with correct weights', () => {
        const url = getGoogleFontsUrl('Roboto');
        expect(url).toContain('wght@400');
    });

    it('returns null for a system font not in the list', () => {
        expect(getGoogleFontsUrl('Comic Sans')).toBeNull();
        expect(getGoogleFontsUrl('Arial')).toBeNull();
    });

    it('encodes spaces in font family name', () => {
        const url = getGoogleFontsUrl('Playfair Display');
        expect(url).toContain('Playfair+Display');
    });
});

// ─── primaryWithOpacity ───────────────────────────────────────────────────────

describe('primaryWithOpacity', () => {
    it('converts hex to rgba with correct opacity', () => {
        // #ff0000 = R:255 G:0 B:0
        expect(primaryWithOpacity('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('handles opacity of 0', () => {
        expect(primaryWithOpacity('#6366f1', 0)).toContain('0)');
    });

    it('handles opacity of 1', () => {
        expect(primaryWithOpacity('#6366f1', 1)).toContain(', 1)');
    });
});
