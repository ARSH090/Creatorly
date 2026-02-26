import type { ReactNode } from 'react';

/**
 * Minimal layout for /auth/* pages (login, register, forgot-password).
 * Renders children directly — no dashboard sidebar, no nav.
 * ClerkProvider is provided by the root layout.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
