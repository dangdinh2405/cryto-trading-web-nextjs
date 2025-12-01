'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';

interface MarketPrice {
    symbol: string;
    open_time: string;
    close_time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface MarketPricesContextType {
    prices: Record<string, MarketPrice>;
    isConnected: boolean;
    subscribe: (symbols: string[]) => void;
    unsubscribe: (symbols: string[]) => void;
}

const MarketPricesContext = createContext<MarketPricesContextType | undefined>(undefined);

const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5001'}/ws/market-prices`;
const RECONNECT_DELAY = 3000;

export function MarketPricesProvider({ children }: { children: ReactNode }) {
    const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const subscribedSymbols = useRef<Set<string>>(new Set());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const mountedRef = useRef(false);

    const sendMessage = useCallback((type: string, symbols: string[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, symbols }));
            console.log(`[MarketPricesProvider] ${type}:`, symbols);
        }
    }, []);

    const subscribe = useCallback((symbols: string[]) => {
        symbols.forEach(symbol => subscribedSymbols.current.add(symbol));
        sendMessage('subscribe', symbols);
    }, [sendMessage]);

    const unsubscribe = useCallback((symbols: string[]) => {
        symbols.forEach(symbol => subscribedSymbols.current.delete(symbol));
        sendMessage('unsubscribe', symbols);
    }, [sendMessage]);

    const connect = useCallback(() => {
        // Prevent multiple connections
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
            console.log('[MarketPricesProvider] Connection already exists, skipping...');
            return;
        }

        console.log('[MarketPricesProvider] 🚀 Creating new WebSocket connection...');
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[MarketPricesProvider] ✅ Connected to WebSocket');
            setIsConnected(true);

            // Re-subscribe to previously subscribed symbols
            if (subscribedSymbols.current.size > 0) {
                const symbols = Array.from(subscribedSymbols.current);
                sendMessage('subscribe', symbols);
            }
        };

        ws.onclose = () => {
            console.log('[MarketPricesProvider] ❌ Disconnected from WebSocket');
            setIsConnected(false);

            // Auto-reconnect after delay (only if still mounted)
            if (mountedRef.current) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('[MarketPricesProvider] 🔄 Reconnecting...');
                    connect();
                }, RECONNECT_DELAY);
            }
        };

        ws.onerror = (error) => {
            console.error('[MarketPricesProvider] ⚠️ WebSocket Error:', error);
            setIsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const data: MarketPrice[] = JSON.parse(event.data);

                setPrices(prevPrices => {
                    const newPrices = { ...prevPrices };
                    data.forEach(price => {
                        newPrices[price.symbol] = price;
                    });
                    return newPrices;
                });
            } catch (error) {
                console.error('[MarketPricesProvider] Parse error:', error);
            }
        };
    }, [sendMessage]);

    // Initialize connection only once
    useEffect(() => {
        mountedRef.current = true;
        console.log('[MarketPricesProvider] 🚀 Initializing WebSocket connection...');
        connect();

        return () => {
            mountedRef.current = false;
            console.log('[MarketPricesProvider] 🛑 Cleanup: Closing WebSocket connection...');

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []); // Empty dependency array - only run once!

    return (
        <MarketPricesContext.Provider
            value={{
                prices,
                isConnected,
                subscribe,
                unsubscribe,
            }}
        >
            {children}
        </MarketPricesContext.Provider>
    );
}

export function useMarketPrices(): MarketPricesContextType {
    const context = useContext(MarketPricesContext);
    if (!context) {
        throw new Error('useMarketPrices must be used within MarketPricesProvider');
    }
    return context;
}
