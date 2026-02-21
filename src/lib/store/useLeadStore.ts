import { create } from 'zustand';

export interface LeadSource {
    id: string;
    label: string;
    type: 'service' | 'product';
    productId?: string;
}

interface LeadState {
    isOpen: boolean;
    source: LeadSource | null;
    openLeadModal: (source: LeadSource) => void;
    closeLeadModal: () => void;
}

export const useLeadStore = create<LeadState>((set) => ({
    isOpen: false,
    source: null,
    openLeadModal: (source) => set({ isOpen: true, source }),
    closeLeadModal: () => set({ isOpen: false, source: null }),
}));
