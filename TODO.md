# TODO

## Integration: localized pricing + back-in-stock

- [x] Inspect and update locale/region pricing defaults (taxRate + shippingCost)

- [x] Update cart summary pages to use localized pricing
  - [x] app/cart/page.tsx
  - [ ] app/[locale]/cart/page.tsx

- [x] Enforce stock in cart store (addItem + updateQuantity)

- [ ] Update add-to-cart/quick view flows to respect stock
- [ ] Add/enable “Notify me” for out-of-stock items
- [ ] Update cart item UI to warn when quantity was clamped / out-of-stock detected
- [ ] Lint + run dev sanity checks

