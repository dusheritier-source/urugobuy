# TODO - Cart + Quick View AliExpress UX

## Step 1: Cart page uses Zustand store
- [x] Update `app/cart/page.tsx` to use `useCartStore()`
- [x] Render `CartItem` list
- [x] Compute subtotal and pass to `CartSummary`


## Step 2: Quick view on product cards
- [ ] Update `components/home/product-grid.tsx` product card:
  - [ ] Click on image/title opens `QuickViewModal`
  - [ ] Keep existing "View all" / "Details" links
- [ ] Update `app/products/page.tsx` product list cards similarly
- [ ] Implement Add to cart inside quick view using `useCartStore.addItem`

## Step 3: Undo actually restores item
- [ ] Update `components/ui/cart-item.tsx` undo to call `addItem` with stored removedItem

## Step 4: Verify
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual check: add/remove/undo + quick view + add to cart

