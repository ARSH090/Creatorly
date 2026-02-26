import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign Up | Creatorly',
    description: 'Create your account and start your free trial.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
