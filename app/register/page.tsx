'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { RegisterForm } from '@/components/RegisterForm';

export default function RegisterPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading CryptoTrade...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-4xl">
                <RegisterForm />
            </div>
        </div>
    );
}
