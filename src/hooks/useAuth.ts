import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';

    useEffect(() => {
        if (!isLoading && requireAuth && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isLoading, requireAuth, isAuthenticated, router]);

    return { session, isAuthenticated, isLoading };
}
