'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Safe check for auth initialization
        if (!auth) {
            console.error('Firebase auth not initialized');
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const idToken = await currentUser.getIdToken();
                    setToken(idToken);
                    localStorage.setItem('authToken', idToken);

                    // Sync with server session (secure cookie)
                    fetch('/api/auth/session', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${idToken}`
                        }
                    }).catch(e => console.error('Session sync error', e));
                } catch (e) {
                    console.error("Error getting token", e);
                }
            } else {
                setToken(null);
                localStorage.removeItem('authToken');
                // Clear server session
                fetch('/api/auth/session', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'logout' })
                }).catch(() => { });
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
        await signInWithPopup(auth, provider);
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Logout error", error);
        }
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
            // Sync refreshed token
            fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            localStorage.setItem('authToken', idToken);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            token,
            signIn,
            signUp,
            signInWithGoogle,
            signOut,
            logout: signOut,
            resetPassword,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
// Also export as useAuthContext for compatibility if needed
export const useAuthContext = useAuth;
