'use client';

/**
 * NewStorefrontRenderer
 * 
 * Client-side renderer for the block-based storefront builder.
 * Receives pre-fetched data from the SSR page and renders blocks using BlockRenderer.
 */

import React, { useEffect } from 'react';
import type { StorefrontBlock, StorefrontThemeV2 } from '@/types/storefront-blocks.types';
import { BlockRenderer, themeToRecord } from './BlockRenderer';
import ChatWidget from './ChatWidget';

interface StorefrontRendererProps {
    blocks: StorefrontBlock[];
    theme: StorefrontThemeV2;
    creator: {
        displayName?: string;
        username?: string;
        avatar?: string;
        bio?: string;
    };
    products?: any[];
    creatorId?: string;
    creatorUsername?: string;
}

function applyTheme(theme: StorefrontThemeV2): React.CSSProperties {
    const style: React.CSSProperties = {
        '--color-primary': theme.primaryColor,
        '--color-secondary': theme.secondaryColor,
        '--color-accent': theme.accentColor,
        '--color-bg': theme.backgroundColor,
        '--color-card': theme.cardColor,
        '--color-text': theme.textColor,
        '--color-muted': theme.mutedColor,
        '--font-family': `'${theme.fontFamily}', system-ui, sans-serif`,
        '--border-radius': `${theme.borderRadius}px`,
        fontFamily: `'${theme.fontFamily}', system-ui, sans-serif`,
        backgroundColor: theme.bgType === 'color' ? theme.backgroundColor : undefined,
        color: theme.textColor,
    } as any;

    if (theme.bgType === 'gradient' && theme.bgValue) {
        style.background = theme.bgValue;
    }

    if (theme.bgType === 'image' && theme.bgValue) {
        style.backgroundImage = `url(${theme.bgValue})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundAttachment = 'fixed';
    }

    return style;
}

// Width class mapping for the grid system
const WIDTH_CLASSES: Record<string, string> = {
    full: 'w-full',
    half: 'w-full md:w-1/2',
    third: 'w-full md:w-1/3',
};

// Group consecutive non-full blocks into rows for grid layout
function groupBlocksIntoRows(blocks: StorefrontBlock[]) {
    const rows: StorefrontBlock[][] = [];
    let currentRow: StorefrontBlock[] = [];

    for (const block of blocks) {
        if (block.width === 'full') {
            // Flush current row
            if (currentRow.length > 0) {
                rows.push(currentRow);
                currentRow = [];
            }
            rows.push([block]);
        } else {
            currentRow.push(block);
            // If 2 half blocks or 3 third blocks, we flush
            const totalFraction = currentRow.reduce((sum, b) => sum + (b.width === 'half' ? 0.5 : 1 / 3), 0);
            if (totalFraction >= 1) {
                rows.push(currentRow);
                currentRow = [];
            }
        }
    }
    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
}

export default function StorefrontRenderer({
    blocks,
    theme,
    creator,
    products = [],
    creatorId,
    creatorUsername,
}: StorefrontRendererProps) {
    const themeRecord = themeToRecord(theme);

    // Sort blocks by order
    const sortedBlocks = [...blocks]
        .filter(b => b.isVisible)
        .sort((a, b) => a.order - b.order);

    const rows = groupBlocksIntoRows(sortedBlocks);

    // Announce blocks split: find announcement blocks to render outside main flow
    const announcementBlocks = sortedBlocks.filter(b => b.type === 'announcement');
    const mainBlocks = sortedBlocks.filter(b => b.type !== 'announcement');
    const mainRows = groupBlocksIntoRows(mainBlocks);

    return (
        <div
            className="min-h-screen overflow-x-hidden selection:bg-indigo-500/30"
            style={applyTheme(theme)}
        >
            {/* Announcement banners (always at top) */}
            {announcementBlocks.map(block => (
                <BlockRenderer
                    key={block.id}
                    block={block}
                    theme={theme}
                    creator={creator}
                    products={products}
                    creatorId={creatorId}
                    creatorUsername={creatorUsername}
                />
            ))}

            {/* Custom CSS */}
            {theme.customCss && (
                <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />
            )}

            {/* Main content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
                {mainRows.map((row, rowIdx) => {
                    if (row.length === 1) {
                        const block = row[0];
                        return (
                            <div key={block.id} className="w-full">
                                <BlockRenderer
                                    block={block}
                                    theme={theme}
                                    creator={creator}
                                    products={products}
                                    creatorId={creatorId}
                                    creatorUsername={creatorUsername}
                                />
                            </div>
                        );
                    }

                    // Multi-column row
                    return (
                        <div key={rowIdx} className="flex flex-wrap gap-6">
                            {row.map(block => (
                                <div key={block.id} className={`${WIDTH_CLASSES[block.width] || 'w-full'} flex-auto`}>
                                    <BlockRenderer
                                        block={block}
                                        theme={theme}
                                        creator={creator}
                                        products={products}
                                        creatorId={creatorId}
                                        creatorUsername={creatorUsername}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                })}

                {/* Footer */}
                <footer className="pt-16 pb-8 text-center border-t" style={{ borderColor: `${theme.textColor}11` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: theme.mutedColor }}>
                        Powered by Creatorly
                    </p>
                </footer>
            </main>

            {/* Chat Widget */}
            {creatorId && <ChatWidget creatorId={creatorId} />}
        </div>
    );
}
