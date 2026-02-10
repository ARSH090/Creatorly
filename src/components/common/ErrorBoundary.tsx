'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // TODO: Send to error reporting service like Sentry
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.fallback) return this.fallback;

            return (
                <div className="min-h-screen bg-white flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-600 mb-4">
                            <AlertTriangle className="w-10 h-10" />
                        </div>

                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            SOMETHING WENT WRONG
                        </h1>

                        <p className="text-gray-500 font-medium leading-relaxed">
                            An unexpected error occurred. Our engineering team has been notified.
                            Please try refreshing or going back home.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                REFRESH PAGE
                            </button>

                            <a
                                href="/"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 border-2 border-gray-100 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                            >
                                <Home className="w-4 h-4" />
                                BACK HOME
                            </a>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-8 text-left p-4 bg-gray-50 rounded-xl border border-gray-100 overflow-auto max-h-48">
                                <p className="text-xs font-mono text-red-600 font-bold uppercase mb-2">Dev Trace:</p>
                                <pre className="text-[10px] text-gray-600 font-mono italic">
                                    {this.state.error.stack}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }

    private get fallback() {
        return this.props.fallback;
    }
}

export default ErrorBoundary;
