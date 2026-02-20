import { z } from 'zod';

export const leadSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
    email: z.string().email('Invalid email address'),
    interest: z.string().min(1, 'Interest is required'),
});

export type LeadInput = z.infer<typeof leadSchema>;
