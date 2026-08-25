# Phase 4: inventory and cart integrity

Phase 4 keeps the browser cart useful while treating Firestore and the
transactional order API as the source of truth.

## Implemented behavior

- All cart additions and quantity updates enforce the product's known stock.
- Cart actions return the requested and accepted quantities instead of silently
  claiming success.
- A global cart notice explains out-of-stock and quantity-clamping events.
- Opening the cart revalidates stock, price, and discount against Firestore.
- Products that became unavailable are removed; reduced quantities and price
  changes are shown to the customer.
- Checkout still performs the final authoritative stock check and decrement in a
  Firestore transaction, protecting against concurrent purchases.
- Product detail and quick-view surfaces offer authenticated back-in-stock alerts.
- Restocking from zero through the product API queues one notification per active
  subscriber and closes each subscription to prevent duplicate messages.
- Cancelling an unpaid order releases stock, reverses promotion usage, and queues
  alerts when a product becomes available again.
- The localized cart uses its locale context for regional tax and shipping rules.

## Notification delivery

`notificationQueue` documents have `type: "back_in_stock"` and
`status: "pending"`. A trusted email worker introduced with fulfilment messaging
must claim, send, and mark these records delivered. Browser clients have no
access to this queue.

## Acceptance tests

- Add fewer than, exactly, and more than available stock.
- Add a product twice and verify the combined quantity never exceeds stock.
- Change Firestore stock while a cart is open, then revisit the cart.
- Change price and discount and confirm the cart explains the update.
- Buy the final unit concurrently from two sessions; only one order may commit.
- Subscribe to a sold-out product, restock it, and confirm exactly one queue item.
- Cancel an unpaid order that restores zero stock and confirm alerts are queued.
- Confirm an out-of-stock product cannot be added from cards, wishlist, product
  detail, or quick view.
