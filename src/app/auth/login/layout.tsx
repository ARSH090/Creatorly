import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign In | Creatorly',
    description: 'Log in to your creator dashboard.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
