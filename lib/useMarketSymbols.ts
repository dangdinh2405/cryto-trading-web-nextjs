import { useState, useEffect } from 'react';
import { api } from './api';

// Cache markets globally to avoid repeated API calls
let marketsCache: any[] | null = null;
let marketsCachePromise: Promise<any[]> | null = null;

/**
 * Hook to get symbol from marketId
 * Returns a map of marketId -> symbol
 */
export function useMarketSymbols() {
    const [symbolMap, setSymbolMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMarkets = async () => {
            try {
                // Use cache if available
                if (marketsCache) {
                    const map: Record<string, string> = {};
                    marketsCache.forEach((m) => {
                        map[m.id] = m.symbol;
                    });
                    setSymbolMap(map);
                    setLoading(false);
                    return;
                }

                // If already loading, wait for that promise
                if (marketsCachePromise) {
                    const markets = await marketsCachePromise;
                    const map: Record<string, string> = {};
                    markets.forEach((m) => {
                        map[m.id] = m.symbol;
                    });
                    setSymbolMap(map);
                    setLoading(false);
                    return;
                }

                // Fetch markets
                marketsCachePromise = api.getMarkets().then((res) => res.data || []);
                const markets = await marketsCachePromise;
                marketsCache = markets;

                const map: Record<string, string> = {};
                markets.forEach((m: any) => {
                    map[m.id] = m.symbol;
                });
                setSymbolMap(map);
            } catch (error) {
                console.error('Failed to load markets:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMarkets();
    }, []);

    return { symbolMap, loading };
}

/**
 * Helper function to get symbol from marketId
 */
export function getSymbolFromMarketId(marketId: string, symbolMap: Record<string, string>): string {
    return symbolMap[marketId] || 'UNKNOWN';
}
