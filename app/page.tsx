'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading CryptoTrade...</p>
      </div>
    </div>
  );
}
