'use client';

import { useEffect } from 'react';
import { useOrderbook } from '@/hooks/useOrderbook';
import { useMarkets } from '@/contexts/MarketContext';

interface OrderBookProps {
  symbol: string;
}

export function OrderBook({ symbol }: OrderBookProps) {
  const { orderbooks, isConnected, subscribe, unsubscribe } = useOrderbook();
  const { getMarketIdBySymbol } = useMarkets();

  const marketId = getMarketIdBySymbol(symbol);
  const orderBook = marketId ? orderbooks[marketId] : null;



  useEffect(() => {
    if (marketId) {
      subscribe([marketId]);
      return () => {
        unsubscribe([marketId]);
      };
    }
  }, [marketId, subscribe, unsubscribe, symbol]);

  // Calculate total as price × amount for each level
  const bids = orderBook?.bids || [];
  const asks = orderBook?.asks || [];

  const bidsWithTotal = bids.map((bid) => ({
    ...bid,
    total: bid.price * bid.amount,
  }));

  const asksWithTotal = asks.map((ask) => ({
    ...ask,
    total: ask.price * ask.amount,
  }));

  return (
    <div className="h-full overflow-auto">
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-2 text-xs">
        <div
          className={`size-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
        />
        <span className="text-muted-foreground">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="text-muted-foreground ml-2">
          (marketId: {marketId || 'N/A'})
        </span>
      </div>

      {!marketId && (
        <div className="text-yellow-500 text-sm p-4">
          Warning: No market ID found for symbol "{symbol}". Check MarketContext.
        </div>
      )}

      {marketId && !orderBook && isConnected && (
        <div className="text-yellow-500 text-sm p-4">
          No orderbook data for market ID "{marketId}". Waiting for data...
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Bids (Buy Orders) */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Price (USDT)</span>
            <span>Amount ({symbol})</span>
            <span>Total</span>
          </div>
          <div className="space-y-1">
            {bidsWithTotal.length === 0 && (
              <div className="text-muted-foreground text-xs">No bids</div>
            )}
            {bidsWithTotal.slice(0, 10).map((bid, index) => (
              <div
                key={index}
                className="flex justify-between text-sm relative"
                style={{
                  background: `linear-gradient(to left, rgba(34, 197, 94, 0.1) ${(bid.total / (bidsWithTotal[9]?.total || 1)) * 100
                    }%, transparent 0%)`,
                }}
              >
                <span className="text-green-500">{bid.price.toFixed(2)}</span>
                <span>{bid.amount.toFixed(4)}</span>
                <span className="text-muted-foreground">
                  {bid.total.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Asks (Sell Orders) */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Price (USDT)</span>
            <span>Amount ({symbol})</span>
            <span>Total</span>
          </div>
          <div className="space-y-1">
            {asksWithTotal.length === 0 && (
              <div className="text-muted-foreground text-xs">No asks</div>
            )}
            {asksWithTotal.slice(0, 10).map((ask, index) => (
              <div
                key={index}
                className="flex justify-between text-sm relative"
                style={{
                  background: `linear-gradient(to left, rgba(239, 68, 68, 0.1) ${(ask.total / (asksWithTotal[9]?.total || 1)) * 100
                    }%, transparent 0%)`,
                }}
              >
                <span className="text-red-500">{ask.price.toFixed(2)}</span>
                <span>{ask.amount.toFixed(4)}</span>
                <span className="text-muted-foreground">
                  {ask.total.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
