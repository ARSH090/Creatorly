'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    username?: string;
    role?: string;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    resetPassword: async () => { },
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Get fresh token
                    const token = await firebaseUser.getIdToken(true);

                    // Verify with backend
                    const response = await fetch('/api/auth/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ idToken: token }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: data.data?.role // Get role from backend
                        });
                    } else {
                        // Backend verification failed
                        console.error('Session verification failed');
                        await firebaseSignOut(auth);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Auth verification error:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Register/Update user in backend
            const token = await result.user.getIdToken();
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken: token,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL
                })
            });

            if (!response.ok) {
                // If register fails (e.g. user exists), we just continue as it might be a login
                // But if it's a new user and reg failed, verify will catch it on next load
                if (response.status !== 409) {
                    const error = await response.json();
                    console.error('Registration/Sync failed:', error);
                }
            }

            router.push('/dashboard');
        } catch (error) {
            console.error('Error signing in with Google', error);
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (error) {
            console.error('Error signing in', error);
            throw error;
        }
    };

    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Register user in backend
            const token = await result.user.getIdToken();
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken: token,
                    displayName: displayName,
                    username: displayName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000)
                })
            });

            if (!response.ok) {
                // If backend registration fails, we should undo firebase auth creation?
                // For now, throw error.
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            router.push('/dashboard');
        } catch (error) {
            console.error('Error signing up', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            router.push('/');
        } catch (error) {
            console.error('Error signing out', error);
        }
    };

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Error sending reset email', error);
            throw error;
        }
    };

    const refreshUser = async () => {
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
            try {
                const token = await firebaseUser.getIdToken(true);
                const response = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken: token }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        role: data.data?.role
                    });
                }
            } catch (error) {
                console.error('Refresh user error:', error);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signIn, signUp, signOut, resetPassword, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
