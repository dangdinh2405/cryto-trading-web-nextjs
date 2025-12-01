'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';

interface OrderBookEntry {
    price: number;
    amount: number;
}

interface OrderBook {
    market_id: string;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    timestamp: string;
}

interface OrderbookContextType {
    orderbooks: Record<string, OrderBook>;
    isConnected: boolean;
    subscribe: (marketIds: string[]) => void;
    unsubscribe: (marketIds: string[]) => void;
}

const OrderbookContext = createContext<OrderbookContextType | undefined>(undefined);

const WS_URL = 'ws://localhost:5001/ws/orderbook';
const RECONNECT_DELAY = 3000;

export function OrderbookProvider({ children }: { children: ReactNode }) {
    const [orderbooks, setOrderbooks] = useState<Record<string, OrderBook>>({});
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const subscribedMarketIds = useRef<Set<string>>(new Set());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const mountedRef = useRef(false);

    const sendMessage = useCallback((type: string, market_ids: string[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, market_ids }));
            console.log(`[OrderbookProvider] ${type}:`, market_ids);
        }
    }, []);

    const subscribe = useCallback((marketIds: string[]) => {
        marketIds.forEach(id => subscribedMarketIds.current.add(id));
        sendMessage('subscribe', marketIds);
    }, [sendMessage]);

    const unsubscribe = useCallback((marketIds: string[]) => {
        marketIds.forEach(id => subscribedMarketIds.current.delete(id));
        sendMessage('unsubscribe', marketIds);
    }, [sendMessage]);

    const connect = useCallback(() => {
        // Prevent multiple connections
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
            console.log('[OrderbookProvider] Connection already exists, skipping...');
            return;
        }

        console.log('[OrderbookProvider] Creating new WebSocket connection...');
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[OrderbookProvider] ✅ Connected to WebSocket');
            setIsConnected(true);

            // Re-subscribe to previously subscribed market IDs
            if (subscribedMarketIds.current.size > 0) {
                const marketIds = Array.from(subscribedMarketIds.current);
                sendMessage('subscribe', marketIds);
            }
        };

        ws.onclose = () => {
            console.log('[OrderbookProvider] ❌ Disconnected from WebSocket');
            setIsConnected(false);

            // Auto-reconnect after delay (only if still mounted)
            if (mountedRef.current) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('[OrderbookProvider] 🔄 Reconnecting...');
                    connect();
                }, RECONNECT_DELAY);
            }
        };

        ws.onerror = (error) => {
            console.error('[OrderbookProvider] ⚠️ WebSocket Error:', error);
            setIsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const data: Record<string, OrderBook> = JSON.parse(event.data);

                setOrderbooks(prevOrderbooks => ({
                    ...prevOrderbooks,
                    ...data,
                }));
            } catch (error) {
                console.error('[OrderbookProvider] Parse error:', error);
            }
        };
    }, [sendMessage]);

    // Initialize connection only once
    useEffect(() => {
        mountedRef.current = true;
        console.log('[OrderbookProvider] 🚀 Initializing WebSocket connection...');
        connect();

        return () => {
            mountedRef.current = false;
            console.log('[OrderbookProvider] 🛑 Cleanup: Closing WebSocket connection...');

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
        <OrderbookContext.Provider
            value={{
                orderbooks,
                isConnected,
                subscribe,
                unsubscribe,
            }}
        >
            {children}
        </OrderbookContext.Provider>
    );
}

export function useOrderbook(): OrderbookContextType {
    const context = useContext(OrderbookContext);
    if (!context) {
        throw new Error('useOrderbook must be used within OrderbookProvider');
    }
    return context;
}
