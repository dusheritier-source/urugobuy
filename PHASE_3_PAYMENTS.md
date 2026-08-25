# Phase 3: payments

Phase 3 integrates Flutterwave Standard hosted checkout for cards and Rwanda
Mobile Money without exposing secret keys or collecting payment credentials in
Urugo Buy.

Official references:

- https://developer.flutterwave.com/v3.0.0/docs/flutterwave-standard-1
- https://developer.flutterwave.com/v3.0/docs/payment-methods
- https://developer.flutterwave.com/docs/webhooks
- https://developer.flutterwave.com/v3.0/docs/refunds

## Configuration

Start in Flutterwave Test Mode. Add the test secret key and a random webhook
secret hash to `.env.local`. Configure the same hash in the Flutterwave dashboard
and set this webhook URL:

```text
https://YOUR_DOMAIN/api/webhooks/flutterwave
```

Set `PAYMENT_CURRENCY` to the currency represented by every product price. Do
not change this variable without migrating the catalog values. Rwanda Mobile
Money requires `RWF`; a USD catalog can use hosted card checkout but not Rwanda
Mobile Money.

## Payment flow

1. The authenticated order API prices the order and reserves stock in Firestore.
2. `/api/payments/initialize` creates a persistent payment attempt and requests a
   hosted checkout link using the server-only Flutterwave key.
3. The browser redirects to Flutterwave; Urugo never receives card credentials.
4. The return page asks the server to verify the transaction.
5. The signed webhook independently verifies the transaction with Flutterwave.
6. Only matching reference, amount, currency, and successful status can mark an
   order paid. Duplicate callbacks and webhooks are idempotent.

## Refunds and reconciliation

Staff can initiate full or partial refunds through
`POST /api/payments/:orderId/refund`. The order records a pending refund until a
signed callback and provider status check confirm the final state. Flutterwave
documents that settlement time depends on the original method.

Staff can run `POST /api/payments/reconcile` to verify up to 50 pending attempts
by merchant reference. Run this from a protected operational job or dashboard;
do not expose it publicly.

Customers can cancel unpaid orders through `POST /api/orders/:id/cancel`. The
server disables the hosted payment link, rechecks payment state transactionally,
releases inventory, and reverses promotion usage. Paid orders must use refunds.

## Go-live checklist

- Complete Flutterwave merchant verification and settlement configuration.
- Use test keys until cards and Rwanda Mobile Money pass end-to-end staging tests.
- Confirm catalog amounts and `PAYMENT_CURRENCY` use the same units.
- Configure the production webhook URL, secret hash, and webhook retries.
- Test duplicate webhooks, altered amounts, wrong currencies, abandoned checkout,
  cancellation, partial refund, full refund, and reconciliation.
- Restrict production secrets to server-side hosting settings and rotate any key
  that may have been exposed.
- Reconcile provider settlements against paid/refunded Firestore orders daily.
