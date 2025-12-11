# 🚀 Crypto Trading Platform

A modern, real-time cryptocurrency trading platform built with **Next.js 16** and **React 19**.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
## Demo
![](image/1.png)

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Real-time Trading** | Market & Limit orders with GTC/IOC/FOK/PostOnly support |
| **Live Order Book** | WebSocket-powered bid/ask visualization |
| **Candlestick Charts** | Powered by TradingView Lightweight Charts |
| **Portfolio Management** | Track holdings, P&L, and trade history |
| **Watchlist** | Save and monitor favorite trading pairs |
| **Dark Mode** | Built-in dark theme by default |
| **Authentication** | JWT-based auth with auto token refresh |
| **Admin Panel** | User management for administrators |

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, SSR)
- **UI:** React 19 + Radix UI + TailwindCSS 4
- **Charts:** Lightweight Charts, Recharts
- **State:** React Context API
- **API:** Go Backend (separate service)

## 📦 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URLs

# Start development server
npm run dev
```

Open **http://localhost:3001** in your browser.

## ⚙️ Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_WS_URL=ws://localhost:5001
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Protected trading dashboard
│   ├── login/              # Authentication
│   └── register/
├── components/             # React components
│   ├── ui/                 # Radix UI primitives
│   ├── Dashboard.tsx       # Main dashboard layout
│   ├── TradingPanel.tsx    # Order placement
│   ├── OrderBook.tsx       # Live order book
│   └── CandlestickChart.tsx
├── contexts/               # React contexts
│   ├── MarketContext.tsx   # Market symbol state
│   ├── MarketPricesContext.tsx
│   └── OrderbookContext.tsx
├── lib/                    # Utilities
│   └── api.ts              # API client with auth
└── hooks/                  # Custom hooks
```

## 🚀 Production Build

```bash
npm run build
npm start
```

## 📄 License

Private - All rights reserved.
