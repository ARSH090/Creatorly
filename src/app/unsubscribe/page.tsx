'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UnsubscribePage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processing your request...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid unsubscribe link (missing token).');
            return;
        }

        const handleUnsubscribe = async () => {
            try {
                const res = await fetch('/api/unsubscribe', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage('You have been successfully unsubscribed. You will no longer receive marketing emails.');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Failed to unsubscribe.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('An unexpected error occurred. Please try again later.');
            }
        };

        handleUnsubscribe();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    {status === 'loading' && (
                        <div className="animate-pulse">
                            <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                            <h2 className="text-xl font-semibold text-gray-700">{message}</h2>
                        </div>
                    )}

                    {status === 'success' && (
                        <div>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Unsubscribed</h2>
                            <p className="text-gray-600 text-sm">{message}</p>
                            <div className="mt-6">
                                <a href="/" className="text-indigo-600 hover:text-indigo-500 font-medium text-sm">
                                    Return to Homepage
                                </a>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Unsubscribe Failed</h2>
                            <p className="text-gray-600 text-sm">{message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
