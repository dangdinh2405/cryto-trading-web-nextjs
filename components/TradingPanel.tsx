'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TradingPanelProps {
  symbol: string;
  marketId: string;
  currentPrice: number;
}

type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';

export function TradingPanel({ symbol, marketId, currentPrice }: TradingPanelProps) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tif, setTif] = useState<TimeInForce>('IOC');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState(''); // For market buy only
  const [balance, setBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBalance();
  }, []);

  useEffect(() => {
    // Auto-set TIF based on order type
    if (orderType === 'market') {
      setTif('IOC'); // Market orders default to IOC
    } else {
      setTif('GTC'); // Limit orders default to GTC
    }
  }, [orderType]);

  useEffect(() => {
    if (orderType === 'market') {
      setPrice(currentPrice.toString());
    }
  }, [currentPrice, orderType]);

  const loadBalance = async () => {
    const response = await api.getBalance();
    if (response.data) {
      setBalance(response.data);
    }
  };

  const calculateTotal = () => {
    const p = parseFloat(price) || currentPrice;
    const a = parseFloat(amount) || 0;
    return p * a;
  };

  const calculateFee = () => {
    return calculateTotal() * 0.001; // 0.1% fee
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (orderType === 'market' && side === 'buy') {
      if (!quoteAmount || parseFloat(quoteAmount) <= 0) {
        toast.error('Please enter quote amount (USDT)');
        return;
      }
    } else {
      if (!amount || parseFloat(amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsLoading(true);

    try {
      let orderData: any = {
        marketId: marketId,
        side: side,
        type: orderType,
        tif: tif,
      };

      // Add fields based on order type and side
      if (orderType === 'market' && side === 'buy') {
        // Market buy: only quote_amount_max
        orderData.quote_amount_max = parseFloat(quoteAmount);
      } else {
        // All others: amount required
        orderData.amount = parseFloat(amount);

        if (orderType === 'limit') {
          orderData.price = parseFloat(price);
        }
      }

      const response = await api.placeOrder(orderData);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(`${side === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
        setAmount('');
        setQuoteAmount('');
        if (orderType === 'limit') setPrice('');
        loadBalance();
      }
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const availableBalance = (() => {
    if (side === 'buy') {
      return balance?.USDT?.available || 0;
    } else {
      // Extract base asset from symbol (e.g., "BTC" from "BTCUSDT")
      const baseAsset = symbol.replace('USDT', '');
      return balance?.[baseAsset]?.available || 0;
    }
  })();

  const maxAmount = () => {
    if (side === 'buy') {
      if (orderType === 'market') {
        return availableBalance * 0.999;
      } else {
        return (availableBalance / (parseFloat(price) || currentPrice)) * 0.999;
      }
    } else {
      return availableBalance;
    }
  };

  const getTifOptions = (): TimeInForce[] => {
    if (orderType === 'market') {
      return ['IOC', 'FOK'];
    } else {
      return ['GTC', 'IOC', 'FOK', 'POST_ONLY'];
    }
  };

  return (
    <Card className="h-full p-4">
      <Tabs value={side} onValueChange={(v) => setSide(v as 'buy' | 'sell')}>
        <TabsList className="w-full">
          <TabsTrigger value="buy" className="flex-1">Buy</TabsTrigger>
          <TabsTrigger value="sell" className="flex-1">Sell</TabsTrigger>
        </TabsList>

        <TabsContent value={side} className="space-y-4 mt-4">
          {/* Order Type */}
          <div className="flex gap-2">
            <Button
              variant={orderType === 'market' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('market')}
              className="flex-1"
            >
              Market
            </Button>
            <Button
              variant={orderType === 'limit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('limit')}
              className="flex-1"
            >
              Limit
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Price (limit orders only) */}
            {orderType === 'limit' && (
              <div className="space-y-2">
                <Label>Price (USDT)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Amount or Quote Amount */}
            {orderType === 'market' && side === 'buy' ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Spending Amount (USDT)</Label>
                  <button
                    type="button"
                    onClick={() => setQuoteAmount(maxAmount().toFixed(2))}
                    className="text-xs text-primary hover:underline"
                  >
                    Max: {maxAmount().toFixed(2)} USDT
                  </button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter USDT amount to spend (quote_amount_max)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Amount ({symbol.replace('USDT', '')})</Label>
                  <button
                    type="button"
                    onClick={() => setAmount(maxAmount().toFixed(8))}
                    className="text-xs text-primary hover:underline"
                  >
                    Max: {maxAmount().toFixed(8)}
                  </button>
                </div>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Time In Force */}
            <div className="space-y-2">
              <Label>Time In Force</Label>
              <Select value={tif} onValueChange={(v) => setTif(v as TimeInForce)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTifOptions().map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                      {option === 'GTC' && ' (Good Til Cancel)'}
                      {option === 'IOC' && ' (Immediate or Cancel)'}
                      {option === 'FOK' && ' (Fill or Kill)'}
                      {option === 'POST_ONLY' && ' (Post Only)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Balance Info */}
            <div className="p-3 bg-secondary rounded space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available</span>
                <span>
                  {availableBalance.toFixed(side === 'buy' ? 2 : 8)} {side === 'buy' ? 'USDT' : symbol.replace('USDT', '')}
                </span>
              </div>

              {(amount || quoteAmount) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span>
                      {orderType === 'market' && side === 'buy'
                        ? parseFloat(quoteAmount || '0').toFixed(2)
                        : calculateTotal().toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee (0.1%)</span>
                    <span>
                      {orderType === 'market' && side === 'buy'
                        ? (parseFloat(quoteAmount || '0') * 0.001).toFixed(2)
                        : calculateFee().toFixed(2)} USDT
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full ${side === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
