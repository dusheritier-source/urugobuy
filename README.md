# Urugo Buy

Urugo Buy is a premium e-commerce web application for Rwanda, built with Next.js 15, TypeScript, Tailwind CSS, Firebase, and modern UI libraries.

## Features
- Premium storefront home page with hero, categories, featured products, reviews, and newsletter
- Product listing and product detail experience
- Cart experience and checkout-ready order summary
- About and contact pages
- Firebase-ready setup for authentication, Firestore, and storage
- Responsive, animated, accessible UI

## Getting started
1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the environment example file
   ```bash
   cp .env.local.example .env.local
   ```
3. Add your Firebase credentials to .env.local
4. Run the dev server
   ```bash
   npm run dev
   ```

## Build
```bash
npm run build
```

## Deploy to Vercel
- Connect the repository to Vercel
- Add the same environment variables in Vercel project settings
- Deploy

Follow [PHASE_1_PRODUCTION_SETUP.md](./PHASE_1_PRODUCTION_SETUP.md) before using
the application with production Firebase data.

The authenticated server API and transactional order design are documented in
[PHASE_2_BACKEND.md](./PHASE_2_BACKEND.md).

Hosted card and Rwanda Mobile Money setup, webhooks, refunds, and reconciliation
are documented in [PHASE_3_PAYMENTS.md](./PHASE_3_PAYMENTS.md).

Cart stock reconciliation and back-in-stock alerts are documented in
[PHASE_4_INVENTORY_CART.md](./PHASE_4_INVENTORY_CART.md).

Fulfilment, returns, transactional email, newsletters, and email campaigns are documented in
[PHASE_5_FULFILMENT_EMAIL.md](./PHASE_5_FULFILMENT_EMAIL.md).
Price-drop alerts are delivered through the same scheduled transactional email
worker; see [PHASE_5_FULFILMENT_EMAIL.md](./PHASE_5_FULFILMENT_EMAIL.md).

Search by photo, model caching, deployment requirements, and verification are documented in [VISUAL_SEARCH.md](./VISUAL_SEARCH.md).

API-powered shopping assistance, secure setup, limits, and verification are documented in [SHOPPING_ASSISTANT.md](./SHOPPING_ASSISTANT.md).

Free catalog-based recommendations, browsing history, and validated bundles are documented in [SMART_RECOMMENDATIONS.md](./SMART_RECOMMENDATIONS.md).

Price-drop watches, private notifications, staff publishing, and retry-worker setup are documented in [PRICE_ALERTS.md](./PRICE_ALERTS.md).

## Languages and catalog translations

The storefront supports Kinyarwanda, English, French, Simplified Chinese, Swahili,
Arabic, Spanish, Portuguese, Hindi, and German. Use the language selector in the
navigation to switch languages. Shared navigation and product-detail controls use
the built-in translation catalog; Arabic pages set right-to-left text direction.

Product title and description translations are managed manually in the admin
product editor under **Manual translations**. A blank translation falls back to
the original product text. No catalog content is sent to an external translation
service.
