# README - Next.js Migration

## Giới thiệu

Dự án **Crypto Trading Platform** đã được migrate từ React + Vite sang **Next.js 16** với App Router.

## Cấu trúc dự án

```
cryto-trading-web-nextjs/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout với providers
│   ├── page.tsx           # Home (redirect to dashboard)
│   ├── login/
│   │   └── page.tsx       # Login page
│   ├── register/
│   │   └── page.tsx       # Register page
│   └── dashboard/
│       └── page.tsx       # Protected dashboard
├── components/            # React components (68 files)
│   ├── ui/               # Radix UI wrappers
│   ├── AuthContext.tsx
│   ├── Dashboard.tsx
│   ├── TradingPanel.tsx
│   └── ...
├── contexts/             # React contexts
│   └── MarketContext.tsx
├── hooks/                # Custom hooks
│   ├── useOrderbook.ts
│   └── useMarketPrices.ts
├── lib/                  # Utility functions
│   ├── api.ts
│   └── utils.ts
├── public/               # Static assets
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Cài đặt

```bash
cd cryto-trading-web-nextjs
npm install
```

## Environment Variables

Tạo `.env.local`:

```env
NEXT_PUBLIC_AAPI_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## Chạy Development Server

```bash
npm run dev
```

Mở [http://localhost:3001](http://localhost:3001)

## Build Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16.0.5 (App Router)
- **UI Library**: React 19.2.0
- **Styling**: TailwindCSS 4.0
- **Components**: Radix UI
- **Charts**: Lightweight Charts, Recharts
- **Backend API**: Go (separate service)

## Features

- ✅ Server-side rendering (SSR)
- ✅ File-based routing
- ✅ Dark mode default
- ✅ Protected routes
- ✅ Real-time market data (WebSocket)
- ✅ Trading panel
- ✅ Order book
- ✅ Authentication

## Migration Notes

Xem [walkthrough.md](file:///../.gemini/antigravity/brain/f6189550-2cc3-4959-8b6a-59d730e16b44/walkthrough.md) để biết chi tiết về quá trình migration.

### Các thay đổi chính:

1. **Routing**: `react-router-dom` → Next.js App Router
2. **Navigation**: `useNavigate()` → `useRouter()` from `next/navigation`
3. **Import paths**: Relative imports → `@/*` alias
4. **Client Components**: Thêm `'use client'` directive
5. **Port**: 3000 → 3001

## License

Private
