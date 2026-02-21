'use client';

import React from 'react'; // useState and useCallback are no longer needed
import type { ServiceButton, StorefrontTheme } from '@/types/storefront.types';
import ServiceButtons from '@/components/storefront/ServiceButtons';
import LeadCaptureModal from '@/components/storefront/LeadCaptureModal';
// Assuming useLeadStore is imported by LeadCaptureModal or ServiceButtons internally,
// or if StorefrontInteractive itself needed it, it would be imported here.
// Based on the instruction, the state is removed from *this* component.

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
    // Local modal state (activeButton, modalOpen, handleOpenModal, handleCloseModal)
    // has been removed as per instruction to use useLeadStore.

    return (
        <>
            <ServiceButtons
                buttons={serviceButtons}
                theme={theme}
                creatorUsername={creatorUsername}
            // onOpenModal prop is removed as ServiceButtons will now use useLeadStore internally
            />
            <LeadCaptureModal
                // open and button props are now managed by useLeadStore internally
                // onClose prop is also managed by useLeadStore internally
                creatorUsername={creatorUsername}
                theme={theme}
            />
        </>
    );
}
