'use client';

import React, { useState, useCallback } from 'react';
import type { ServiceButton, StorefrontTheme } from '@/types/storefront.types';
import ServiceButtons from '@/components/storefront/ServiceButtons';
import LeadCaptureModal from '@/components/storefront/LeadCaptureModal';

interface StorefrontInteractiveProps {
    serviceButtons: ServiceButton[];
    theme: StorefrontTheme;
    creatorUsername: string;
}

/**
 * Thin client wrapper that owns the modal open/close state.
 * The parent page is a server component; this isolates all client
 * interactivity without making the whole page a client component.
 */
export default function StorefrontInteractive({
    serviceButtons,
    theme,
    creatorUsername,
}: StorefrontInteractiveProps) {
    const [activeButton, setActiveButton] = useState<ServiceButton | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const handleOpenModal = useCallback((button: ServiceButton) => {
        setActiveButton(button);
        setModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
        // Let animation finish before clearing button data
        setTimeout(() => setActiveButton(null), 350);
    }, []);

    return (
        <>
            <ServiceButtons
                buttons={serviceButtons}
                theme={theme}
                creatorUsername={creatorUsername}
                onOpenModal={handleOpenModal}
            />
            <LeadCaptureModal
                open={modalOpen}
                button={activeButton}
                creatorUsername={creatorUsername}
                theme={theme}
                onClose={handleCloseModal}
            />
        </>
    );
}
