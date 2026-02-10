import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/client';
import {
    onAuthStateChanged,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithRedirect,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    sendPasswordResetEmail
} from 'firebase/auth';

export interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    token: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Get ID token and store for API calls
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);
                localStorage.setItem('authToken', idToken);
            } else {
                setToken(null);
                localStorage.removeItem('authToken');
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const refreshUser = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            setUser({ ...auth.currentUser });
            const idToken = await auth.currentUser.getIdToken(true);
            setToken(idToken);
            localStorage.setItem('authToken', idToken);
        }
    };

    return {
        user,
        loading,
        token,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        logout: signOut,
        resetPassword,
        refreshUser,
    };
}
