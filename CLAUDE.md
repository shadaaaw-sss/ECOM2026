# Makhmal Frontend — CLAUDE.md

## Stack
- **Framework**: Next.js 13.5.1 (App Router) + React 18.2.0
- **Styling**: Tailwind CSS 3.3.3 + `tailwindcss-animate` + `clsx` + `tailwind-merge` + `class-variance-authority`
- **UI**: 47 shadcn/ui components (`components/ui/`)
- **Icons**: lucide-react 0.446.0
- **Forms**: react-hook-form 7.53.0 + @hookform/resolvers 3.9.0 + zod 3.23.8
- **Animation**: framer-motion 11.11.7
- **Carousel**: embla-carousel-react 8.3.0
- **HTTP**: fetch wrapper in `lib/api.ts` (no axios)
- **Charts**: recharts 2.12.7
- **Notifications**: sonner 1.5.0
- **Theme**: next-themes 0.3.0

## Project Structure
```
app/                      # Next.js App Router pages
  admin/page.tsx          # Monolithic admin SPA with tabs
  brands/[id]/page.tsx    # Brand detail + category filter sub-nav
  brands/page.tsx         # Ultra-minimalist brand grid (logos only)
  products/[id]/page.tsx  # Product detail with ProductGallery
  page.tsx                # Homepage with HeroSection (dynamic from API)
components/
  HeroSection.tsx          # Fullscreen hero with image/video slides
  MediaManager.tsx         # Admin media upload/reorder for products
  ProductCard.tsx          # Product card with wishlist, add-to-cart
  ProductGallery.tsx       # Client image/video carousel gallery
  Navbar.tsx, Footer.tsx   # Layout components
  DirectionWrapper.tsx     # RTL direction wrapper
  ui/                      # shadcn/ui components (47 files)
context/
  AuthContext.tsx           # JWT auth state
  CartContext.tsx           # Cart with localStorage persistence
  CurrencyContext.tsx       # Multi-currency (QAR/USD/EUR/SAR/AED/KWD/OMR)
  LanguageContext.tsx       # i18n (en/fr/ar) + RTL
lib/
  api.ts                    # ApiClient fetch wrapper with JWT
  currency.ts               # convertPrice(), formatPrice(), SUPPORTED_CURRENCIES
  translations.ts           # 3-locale dictionary (1046 lines)
  types.ts                  # TypeScript interfaces (Brand, Product, Order, etc.)
  utils.ts                  # General utilities
```

## Conventions
- **All pages are `'use client'`** — no server components
- **Naming**: snake_case for DB fields, camelCase for JS props; transform in Zod schemas
- **API**: `api.get<T>(path)`, `api.post<T>(path, body)`, etc. (from `lib/api.ts`)
- **Auth token**: stored in `localStorage('makhmal_token')`, managed via `AuthContext`
- **Locale**: stored in `localStorage('makhmal_locale')`, managed via `LanguageContext`
- **Currency**: stored in `localStorage('makhmal_currency')`, managed via `CurrencyContext`
- **Cart**: stored in `localStorage('makhmal_cart')`, managed via `CartContext`
- **i18n**: use `useLanguage()` hook → `t('translation_key')`, `isRTL`, `currency`
- **Currency**: use `useCurrency()` hook → `convert(amountQAR)` and `format(amountQAR)` take a **raw QAR amount** and synchronously convert+format it to the selected currency; `setCurrency(code)` switches currency (persisted to `localStorage`)
- **CSS theme**: custom colors in `tailwind.config` — `beige`, `burgundy`, `gold`, `cream`, `foreground`, `muted-foreground`
- **RTL**: Arabic locale → `dir={isRTL ? 'rtl' : 'ltr'}` on root divs + `flex-row-reverse` for navs
- **Zod schemas**: all in `backend/src/schemas/validation.ts` — shared via API types on frontend

## Key Patterns
- **Loading state**: `animate-pulse` skeleton placeholders matching content shape
- **Empty state**: dashed border box with centered icon + message
- **Error state**: `try/catch` in all fetch handlers, minimal UI feedback via `sonner` toast
- **Forms**: react-hook-form with zod resolver for complex forms (checkout), controlled inputs for simple ones
- **Image fallback**: colored gradient div with first-letter initial when no URL
- **Product price**: prices are stored in the DB as raw QAR. Never render them directly — always run them through `useCurrency().format(Number(price) || 0)`, which converts to the user's selected currency and formats it. Admin screens (`app/admin`) are the one exception and intentionally stay in raw QAR.

## API Base URL
`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'`
