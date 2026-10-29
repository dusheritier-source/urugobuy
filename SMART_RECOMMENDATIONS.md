# Smart product recommendations

Recommendations run from the published product catalog and this browser's recent product views. They do not use an AI provider, API key, billing account, or external tracking service.

## Shopper experience

- **Home:** top-rated available picks for a new browser, then suggestions inspired by recent browsing. Products already viewed or in the cart are excluded from these suggestions. A type-diversity cap prevents one product type from filling every slot.
- **Product pages:** related items rank by matching product type, title features, category, brand and price proximity. The current product and unavailable items are excluded. Reasons are shown on cards.
- **Recently viewed:** product-detail visits and quick views update a deduplicated, newest-first list of up to ten product IDs in the existing browser UI store. Recently viewed shelves display up to four current published records, exclude the product being viewed, and keep published out-of-stock items visible with an availability label. Removed products disappear. **Clear browsing history** removes the stored IDs.
- **Complete your setup:** curated product-type relationships suggest useful companions, such as a cushion/light for a reading chair, a chopping board for kitchen tools, or makeup applicators for makeup. There is no unrelated fallback when a relationship cannot be identified. Electronics suggestions disclose that connector/console compatibility needs checking. These are suggestions, not claims of verified hardware compatibility or past co-purchases.

## Bundle correctness

The shopper chooses accessories using checkboxes; the base product remains selected. Each selected item adds one unit. Totals sum each item's actual discounted selling price. Savings describe existing item discounts; there is no extra or invented bundle discount. Tax, shipping and coupons are handled by ordinary checkout.

On **Add selected items**, `POST /api/recommendations/bundle` validates distinct product IDs and expected selling prices against fresh published catalog data. Missing or unavailable products return a clear error. A changed price refreshes the displayed records and requires another click to confirm; no cart mutation happens on that response. Responses are private/no-store and requests are rate-limited and body-bounded.

The cart's `addBundle` action then validates stock against its latest quantities and applies all selected additions in one state update. If any item lacks sufficient remaining stock, none of the additions are applied. Repeated IDs and empty/oversized bundles are rejected. Successful additions refresh selected cart lines with current price, discount and stock. Server checkout retains the authoritative transaction and stock reservation.

## Data and maintenance

`lib/recommendations.ts` contains the deterministic ranking and product-type relationships. `lib/bundle-cart.ts` contains the pure atomic merge used by the existing cart store. `components/recommendations` provides shared cards and storefront integration; the existing related/recently-viewed/bundle components now receive the server catalog instead of importing a separate starter list.

The catalog source is `lib/server/catalog.ts`: published Firestore data when server credentials are configured, otherwise the starter catalog for development. Product types are inferred from current category/title metadata. Products with no known complement relationship receive related-category choices but no bundle. As catalog categories expand, add relevant type rules and cover them with tests. No actual order-history/co-purchase ranking is claimed or collected.

History stays in the browser; clearing it switches the home shelf back to available top-rated picks. Catalog pages can cache public product data for up to a minute; bundle validation reads fresh data. Hosting/database quotas remain separate from this feature's zero AI API usage.

## Verify

```sh
npm run test:recommendations
npm run typecheck
npm run build
npm run test:recommendations:browser
```

Browser tests use the existing Playwright production-server configuration on port 3100. They exercise ordered history, clearing, personalized exclusions, related navigation, changing selections and totals, real bundle validation, price-change reconfirmation, no partial additions on stock failure, and mobile layout. Unit tests cover ranking, complementary relationships, limits, deduplication, published-record resolution, per-item discount arithmetic, and atomic cart updates.
