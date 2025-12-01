'use client';

import type React from 'react';
import { MarketProvider } from '@/contexts/MarketContext';
import { OrderbookProvider } from '@/contexts/OrderbookContext';
import { MarketPricesProvider } from '@/contexts/MarketPricesContext';
import { AuthProvider } from '@/components/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';
import { useEffect } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Enable dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Crypto Trading Platform</title>
        <meta name="description" content="Professional crypto trading platform" />
      </head>
      <body>
        <MarketProvider>
          <OrderbookProvider>
            <MarketPricesProvider>
              <AuthProvider>
                {children}
                <Toaster position="top-right" />
              </AuthProvider>
            </MarketPricesProvider>
          </OrderbookProvider>
        </MarketProvider>
      </body>
    </html>
  );
}

