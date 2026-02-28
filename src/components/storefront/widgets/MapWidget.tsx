'use client';

import React from 'react';
import type { MapSettings } from '@/types/storefront-blocks.types';
import { MapPin, Navigation } from 'lucide-react';

interface MapWidgetProps {
    settings: MapSettings;
    theme: Record<string, string>;
}

export default function MapWidget({ settings, theme }: MapWidgetProps) {
    const { address, embedUrl, showDirectionsButton = true, title } = settings;
    const borderRadius = Number(theme.borderRadius || 12);
    const primaryColor = theme.primaryColor || '#6366f1';
    const mapHeight = 300;

    const encodedAddress = encodeURIComponent(address || '');
    const googleMapsEmbed = embedUrl
        ? embedUrl
        : `https://maps.google.com/maps?q=${encodedAddress}&z=15&output=embed`;

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

    if (!address && !embedUrl) {
        return (
            <div className="text-center py-10 opacity-30">
                <MapPin size={32} className="mx-auto mb-2 opacity-40" style={{ color: theme.textColor }} />
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>Add a location or Google Maps URL</p>
            </div>
        );
    }

    return (
        <div className="w-full py-2 space-y-3">
            {(title || address) && (
                <div className="flex items-center gap-2">
                    <MapPin size={18} style={{ color: primaryColor }} />
                    <div>
                        {title && <h3 className="font-bold text-base" style={{ color: theme.textColor }}>{title}</h3>}
                        {address && <p className="text-sm opacity-60" style={{ color: theme.textColor }}>{address}</p>}
                    </div>
                </div>
            )}

            <div className="w-full overflow-hidden" style={{ borderRadius, height: mapHeight }}>
                <iframe
                    src={googleMapsEmbed}
                    width="100%"
                    height={mapHeight}
                    style={{ border: 'none' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={title || 'Location Map'}
                />
            </div>

            {showDirectionsButton && address && (
                <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all hover:opacity-90"
                    style={{
                        backgroundColor: `${primaryColor}18`,
                        border: `1px solid ${primaryColor}44`,
                        borderRadius,
                        color: primaryColor,
                    }}
                >
                    <Navigation size={16} />
                    Get Directions
                </a>
            )}
        </div>
    );
}
