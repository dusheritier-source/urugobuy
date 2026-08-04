# Plan to complete TODO_CART_QUICKVIEW_STEPS

## Information Gathered
- `TODO_CART_QUICKVIEW_STEPS.md` contains steps for:
  1) Cart subtotal
  2) Quick view behavior on product cards + add to cart inside modal
  3) Undo in cart
  4) Verify
- `app/cart/page.tsx`:
  - Uses `useCartStore((s) => s.items)`
  - Computes `subtotal` from store items and passes it into `CartSummary`
- `components/ui/cart-item.tsx`:
  - Implements remove with an `undo` state
  - Undo calls `useCartStore().addItem(removedItem, removedItem.quantity)`
- `components/ui/quick-view-modal.tsx`:
  - Quick view modal renders “Add to Cart” which calls `useCartStore.addItem(product, 1)`
- Product quick-view grids:
  - `app/products/product-grid-quickview.tsx` opens `QuickViewModal` on clicking card image/title and keeps `Details →` link
  - `components/home/product-grid-quickview.tsx` also opens `QuickViewModal` on image/title and keeps “View all” + product layout with add button
- `components/home/product-grid.tsx` delegates quick-view behavior to `ProductGridQuickView`

## Plan
1) Update `TODO_CART_QUICKVIEW_STEPS.md` checkboxes to match the current implementation:
   - Step 1: mark subtotal computation as done (it is already computed and passed).
   - Step 2: mark quick view + add-to-cart inside quick view as done (the relevant components already implement it).
   - Step 3: mark undo as done (cart-item undo already re-adds removed item).
2) Run lint + build to ensure nothing broke.
3) Quick manual verification instructions (for the user):
   - Add to cart from quick view
   - Remove from cart
   - Click Undo and confirm item is restored

## Dependent Files to be edited
- `TODO_CART_QUICKVIEW_STEPS.md`

## Followup steps
- `npm run lint`
- `npm run build`

<ask_followup_question>
Proceed with updating TODO_CART_QUICKVIEW_STEPS.md checkboxes to “done” based on the inspected code, and then run lint + build?
</ask_followup_question>

