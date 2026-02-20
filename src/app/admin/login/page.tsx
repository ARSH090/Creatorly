'use client';

import { SignIn } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminLoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
                    <CardDescription className="text-center">
                        Please sign in with your admin account
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <SignIn
                        routing="hash"
                        forceRedirectUrl="/admin"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
