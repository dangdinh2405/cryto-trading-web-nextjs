'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export function OrdersView() {
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);

    const [openRes, historyRes, tradesRes] = await Promise.all([
      api.getOrders('open'),
      api.getOrders(),
      api.getTradeHistory(),
    ]);

    console.log('Open Orders Response:', openRes);
    console.log('History Response:', historyRes);
    console.log('Trades Response:', tradesRes);

    // Backend returns array directly in { data: [...] }
    if (openRes.data) setOpenOrders(openRes.data);
    if (historyRes.data) setOrderHistory(historyRes.data);
    if (tradesRes.data) setTradeHistory(tradesRes.data);

    setLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    const response = await api.cancelOrder(orderId);

    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success('Order canceled successfully');
      loadOrders();
    }
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'N/A';

    // Handle sql.NullTime from Go backend { Time: "2024-...", Valid: true }
    if (typeof dateInput === 'object' && dateInput.Time) {
      return new Date(dateInput.Time).toLocaleString();
    }

    // Handle ISO string
    if (typeof dateInput === 'string') {
      return new Date(dateInput).toLocaleString();
    }

    return 'Invalid Date';
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading orders...</div>;
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <h2 className="text-2xl mb-6">Orders & Trades</h2>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open Orders ({openOrders.length})</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
          <TabsTrigger value="trades">Trade History</TabsTrigger>
        </TabsList>

        {/* Open Orders */}
        <TabsContent value="open">
          <Card>
            <CardContent className="pt-6">
              {openOrders.length > 0 ? (
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Pair</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Amount</th>
                        <th className="pb-2 text-right">Filled</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openOrders.map((order) => {
                        // Support both 'id' (Go backend) and 'orderId' (camelCase)
                        const orderId = order.id || order.orderId;
                        return (
                          <tr key={orderId} className="border-b">
                            <td className="py-3 text-sm">{formatDate(order.createdAt)}</td>
                            <td>{order.symbol}</td>
                            <td className="capitalize">{order.type}</td>
                            <td className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                              {order.side.toUpperCase()}
                            </td>
                            <td className="text-right">${order.price ? order.price.toFixed(2) : 'Market'}</td>
                            <td className="text-right">{order.amount ? order.amount.toFixed(8) : 'N/A'}</td>
                            <td className="text-right">{order.filled ? order.filled.toFixed(8) : '0.00000000'}</td>
                            <td>
                              <span className="inline-block px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-500">
                                {order.status}
                              </span>
                            </td>
                            <td className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelOrder(orderId)}
                              >
                                <X className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No open orders
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order History */}
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {orderHistory.length > 0 ? (
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Pair</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Amount</th>
                        <th className="pb-2 text-right">Filled</th>
                        <th className="pb-2 text-right">Fee</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderHistory.map((order) => {
                        // Support both 'id' (Go backend) and 'orderId' (camelCase)
                        const orderId = order.id || order.orderId;
                        return (
                          <tr key={orderId} className="border-b">
                            <td className="py-3 text-sm">{formatDate(order.createdAt)}</td>
                            <td>{order.symbol}</td>
                            <td className="capitalize">{order.type}</td>
                            <td className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                              {order.side.toUpperCase()}
                            </td>
                            <td className="text-right">${order.price ? order.price.toFixed(2) : 'Market'}</td>
                            <td className="text-right">{order.amount ? order.amount.toFixed(8) : 'N/A'}</td>
                            <td className="text-right">{order.filled ? order.filled.toFixed(8) : '0.00000000'}</td>
                            <td className="text-right">${order.fee ? order.fee.toFixed(2) : '0.00'}</td>
                            <td>
                              <span className={`inline-block px-2 py-1 rounded text-xs ${order.status === 'filled'
                                ? 'bg-green-500/20 text-green-500'
                                : order.status === 'canceled'
                                  ? 'bg-red-500/20 text-red-500'
                                  : 'bg-yellow-500/20 text-yellow-500'
                                }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No order history
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade History */}
        <TabsContent value="trades">
          <Card>
            <CardContent className="pt-6">
              {tradeHistory.length > 0 ? (
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Pair</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2 text-right">Price</th>
                        <th className="pb-2 text-right">Amount</th>
                        <th className="pb-2 text-right">Total</th>
                        <th className="pb-2 text-right">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeHistory.map((trade, index) => {
                        // Support both camelCase (mock) and PascalCase (Go backend)
                        const tradeId = trade.tradeId || trade.ID;
                        const symbol = trade.symbol || trade.Symbol;
                        const side = trade.side || trade.Side;
                        const price = trade.price || trade.Price || 0;
                        const amount = trade.amount || trade.Amount || 0;
                        const fee = trade.fee || trade.Fee || 0;
                        const timestamp = trade.timestamp || trade.TradeTime;
                        const total = price * amount;

                        return (
                          <tr key={tradeId || `trade-${index}`} className="border-b">
                            <td className="py-3 text-sm">{formatDate(timestamp)}</td>
                            <td>{symbol}</td>
                            <td className={side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                              {side?.toUpperCase() || 'N/A'}
                            </td>
                            <td className="text-right">${price.toFixed(2)}</td>
                            <td className="text-right">{amount.toFixed(8)}</td>
                            <td className="text-right">${total.toFixed(2)}</td>
                            <td className="text-right">${fee.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No trade history
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
