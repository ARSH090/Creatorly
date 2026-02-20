import { LeadInput } from '@/lib/validation/leadSchema';

export type LeadData = LeadInput;
export interface LeadResponse {
    success: boolean;
    message?: string;
    data?: any;
}
